import type { Metadata } from "next";
import { notFound } from "next/navigation";

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

export default async function MemoriaDetalhePage({
  params,
}: PageProps<"/memoria/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: reflection } = await supabase
    .from("historical_reflections")
    .select("id, title, body, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!reflection) {
    notFound();
  }

  const { count: chunkCount } = await supabase
    .from("historical_reflection_chunks")
    .select("id", { count: "exact", head: true })
    .eq("historical_reflection_id", reflection.id);

  const importedAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(reflection.created_at));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>{reflection.title}</CardTitle>
          <CardDescription>
            Importada em {importedAt} · {chunkCount ?? 0} trecho(s) indexado(s)
            para busca semântica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{reflection.body}</p>
        </CardContent>
      </Card>
    </div>
  );
}
