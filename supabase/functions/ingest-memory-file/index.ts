import { createClient } from "jsr:@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_EMBEDDING_MODEL =
  Deno.env.get("OPENAI_EMBEDDING_MODEL") ?? "text-embedding-3-small";
const SUPPORTED_MIME_TYPES = new Set(["text/plain", "text/markdown"]);
const MAX_CHUNK_CHARS = 1200;
const PIPELINE_VERSION = "v1";

function chunkText(text: string): string[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length > MAX_CHUNK_CHARS && current) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);

  return chunks.length > 0 ? chunks : [text.trim()].filter(Boolean);
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const maxAttempts = 3;

  for (let attempt = 1; ; attempt++) {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: OPENAI_EMBEDDING_MODEL, input: texts }),
    });

    if (response.ok) {
      const json = await response.json();
      return (json.data as Array<{ index: number; embedding: number[] }>)
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);
    }

    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt >= maxAttempts) {
      const body = await response.text();
      throw new Error(
        `OpenAI embeddings falhou (${response.status}): ${body.slice(0, 300)}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "OPENAI_API_KEY não configurada nos secrets da função.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let memoryImportId: string;
  try {
    const body = await req.json();
    memoryImportId = body.memory_import_id;
    if (!memoryImportId) throw new Error("memory_import_id ausente");
  } catch {
    return new Response(JSON.stringify({ error: "Corpo inválido." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Claim atômico: só processa se ainda estiver "pending". A policy de
  // RLS já garante que só o dono do import consegue vê-lo/atualizá-lo.
  const { data: claimed, error: claimError } = await userClient
    .from("memory_imports")
    .update({ status: "processing", error: null })
    .eq("id", memoryImportId)
    .eq("status", "pending")
    .select("id, user_id, storage_path, mime_type, original_filename")
    .single();

  if (claimError || !claimed) {
    return new Response(
      JSON.stringify({ error: "Importação não encontrada ou já processada." }),
      { status: 409, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    if (!SUPPORTED_MIME_TYPES.has(claimed.mime_type)) {
      throw new Error(
        `Formato "${claimed.mime_type}" ainda não suportado nesta etapa. Envie .txt ou .md.`,
      );
    }

    const { data: fileBlob, error: downloadError } = await userClient.storage
      .from("memory-imports")
      .download(claimed.storage_path);

    if (downloadError || !fileBlob) {
      throw new Error("Não foi possível baixar o arquivo enviado.");
    }

    const text = (await fileBlob.text()).trim();
    if (!text) {
      throw new Error("O arquivo está vazio.");
    }

    const chunks = chunkText(text);
    const embeddings = await embedBatch(chunks);

    const { data: reflection, error: reflectionError } = await serviceClient
      .from("historical_reflections")
      .insert({
        user_id: claimed.user_id,
        memory_import_id: claimed.id,
        title: claimed.original_filename,
        body: text,
      })
      .select("id")
      .single();

    if (reflectionError || !reflection) {
      throw new Error("Não foi possível salvar a memória extraída.");
    }

    const rows = chunks.map((content, index) => ({
      user_id: claimed.user_id,
      historical_reflection_id: reflection.id,
      chunk_index: index,
      content,
      embedding: embeddings[index],
      embedding_model: OPENAI_EMBEDDING_MODEL,
      embedding_dimensions: embeddings[index].length,
      pipeline_version: PIPELINE_VERSION,
    }));

    const { error: chunksError } = await serviceClient
      .from("historical_reflection_chunks")
      .insert(rows);

    if (chunksError) {
      throw new Error("Não foi possível salvar os trechos processados.");
    }

    await userClient
      .from("memory_imports")
      .update({ status: "completed" })
      .eq("id", claimed.id);

    return new Response(
      JSON.stringify({ historical_reflection_id: reflection.id }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido.";

    await userClient
      .from("memory_imports")
      .update({ status: "failed", error: message })
      .eq("id", claimed.id);

    return new Response(JSON.stringify({ error: message }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }
});
