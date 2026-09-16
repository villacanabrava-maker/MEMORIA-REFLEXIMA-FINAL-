import Link from "next/link";
import type { Metadata } from "next";

import { MemoryUploadForm } from "@/components/memory/memory-upload-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Memória — Memória Reflexiva",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando",
  processing: "Processando",
  completed: "Concluída",
  failed: "Falhou",
};

export default async function MemoriaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: imports } = user
    ? await supabase
        .from("memory_imports")
        .select("id, original_filename, status, error, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
    : { data: null };

  const { data: reflections } = user
    ? await supabase
        .from("historical_reflections")
        .select("id, memory_import_id")
        .eq("user_id", user.id)
    : { data: null };

  const reflectionByImportId = new Map(
    reflections?.map((reflection) => [reflection.memory_import_id, reflection.id]),
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Memória</h1>
        <p className="text-muted-foreground text-sm">
          Importe reflexões históricas suas para que o motor de geração possa
          consultá-las no futuro.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova importação</CardTitle>
          <CardDescription>
            O texto é dividido em trechos e transformado em embeddings para
            busca semântica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemoryUploadForm />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Importações</h2>
        {imports && imports.length > 0 ? (
          imports.map((item) => {
            const reflectionId = reflectionByImportId.get(item.id);
            const content = (
              <Card className={reflectionId ? "hover:bg-accent/50 transition-colors" : ""}>
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="font-medium">{item.original_filename}</span>
                    {item.status === "failed" && item.error && (
                      <span className="text-destructive text-xs">{item.error}</span>
                    )}
                  </div>
                  <span className="text-muted-foreground text-sm shrink-0">
                    {STATUS_LABEL[item.status] ?? item.status}
                  </span>
                </CardContent>
              </Card>
            );

            return reflectionId ? (
              <Link key={item.id} href={`/memoria/${reflectionId}`}>
                {content}
              </Link>
            ) : (
              <div key={item.id}>{content}</div>
            );
          })
        ) : (
          <p className="text-muted-foreground text-sm">
            Nenhuma memória importada ainda.
          </p>
        )}
      </div>
    </div>
  );
}
