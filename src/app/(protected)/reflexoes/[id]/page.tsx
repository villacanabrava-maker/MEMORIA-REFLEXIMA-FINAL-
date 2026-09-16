import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CommentForm } from "@/components/editorial/comment-form";
import { SourceForm } from "@/components/editorial/source-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Reflexão — Memória Reflexiva",
};

export default async function ReflexaoPage({
  params,
}: PageProps<"/reflexoes/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: session } = await supabase
    .from("reflection_sessions")
    .select("id, session_date")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!session) {
    notFound();
  }

  const [{ data: source }, { data: comment }] = await Promise.all([
    supabase
      .from("daily_sources")
      .select("title, source_date, author, body")
      .eq("session_id", session.id)
      .maybeSingle(),
    supabase
      .from("reflection_comments")
      .select("body")
      .eq("session_id", session.id)
      .maybeSingle(),
  ]);

  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
  }).format(new Date(`${session.session_date}T00:00:00`));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <p className="text-muted-foreground text-sm capitalize">
          {formattedDate}
        </p>
        <h1 className="text-2xl font-semibold">Reflexão do dia</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fonte</CardTitle>
          <CardDescription>
            O texto ou trecho recebido hoje que vai inspirar a reflexão.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SourceForm
            sessionId={session.id}
            defaultValues={
              source
                ? {
                    title: source.title,
                    sourceDate: source.source_date,
                    author: source.author,
                    body: source.body,
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comentário</CardTitle>
          <CardDescription>
            Seu comentário pessoal sobre a fonte de hoje.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CommentForm
            sessionId={session.id}
            defaultValues={comment ? { body: comment.body } : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
