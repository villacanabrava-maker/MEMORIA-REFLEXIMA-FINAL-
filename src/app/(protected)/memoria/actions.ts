"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type UploadState = { error?: string } | null;

const EXTENSION_MIME: Record<string, string> = {
  txt: "text/plain",
  md: "text/markdown",
  markdown: "text/markdown",
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export async function uploadMemory(
  _prevState: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "Arquivo muito grande (limite de 2 MB nesta etapa)." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = EXTENSION_MIME[extension];
  if (!mimeType) {
    return { error: "Formato não suportado nesta etapa. Envie .txt ou .md." };
  }

  const storagePath = `${user.id}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("memory-imports")
    .upload(storagePath, file, { contentType: mimeType });

  if (uploadError) {
    return { error: "Não foi possível enviar o arquivo." };
  }

  const { data: importRow, error: insertError } = await supabase
    .from("memory_imports")
    .insert({
      user_id: user.id,
      storage_path: storagePath,
      original_filename: file.name,
      mime_type: mimeType,
    })
    .select("id")
    .single();

  if (insertError || !importRow) {
    return { error: "Não foi possível registrar a importação." };
  }

  const { data: result, error: functionError } = await supabase.functions.invoke(
    "ingest-memory-file",
    { body: { memory_import_id: importRow.id } },
  );

  revalidatePath("/memoria");

  if (functionError || !result?.historical_reflection_id) {
    return {
      error:
        "O arquivo foi enviado, mas o processamento falhou. Veja o status na lista abaixo.",
    };
  }

  redirect(`/memoria/${result.historical_reflection_id}`);
}
