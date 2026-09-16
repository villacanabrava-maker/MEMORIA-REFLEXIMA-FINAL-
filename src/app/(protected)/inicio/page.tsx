import Link from "next/link";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Início — Memória Reflexiva",
};

function sessionStatus(hasSource: boolean, hasComment: boolean) {
  if (!hasSource) return "Fonte pendente";
  if (!hasComment) return "Comentário pendente";
  return "Pronta para revisão";
}

export default async function InicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single()
    : { data: null };

  const todayStr = new Date().toISOString().slice(0, 10);

  const { data: sessions } = user
    ? await supabase
        .from("reflection_sessions")
        .select("id, session_date")
        .eq("user_id", user.id)
        .eq("session_date", todayStr)
        .order("created_at", { ascending: false })
    : { data: null };

  const sessionIds = sessions?.map((session) => session.id) ?? [];

  const [{ data: sources }, { data: comments }] = await Promise.all([
    sessionIds.length
      ? supabase.from("daily_sources").select("session_id").in("session_id", sessionIds)
      : Promise.resolve({ data: [] as { session_id: string }[] }),
    sessionIds.length
      ? supabase
          .from("reflection_comments")
          .select("session_id")
          .in("session_id", sessionIds)
      : Promise.resolve({ data: [] as { session_id: string }[] }),
  ]);

  const sourceSessionIds = new Set(sources?.map((source) => source.session_id));
  const commentSessionIds = new Set(comments?.map((comment) => comment.session_id));

  const today = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  return (
    <div className="flex flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm capitalize">{today}</p>
        <h1 className="text-2xl font-semibold">
          Olá, {profile?.display_name ?? user?.email}
        </h1>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Sessões de hoje</h2>
        <Button asChild size="sm">
          <Link href="/reflexoes/nova">Nova reflexão</Link>
        </Button>
      </div>

      {sessions && sessions.length > 0 ? (
        <div className="flex flex-col gap-3">
          {sessions.map((session) => (
            <Link key={session.id} href={`/reflexoes/${session.id}`}>
              <Card className="hover:bg-accent/50 transition-colors">
                <CardContent className="flex items-center justify-between">
                  <span className="font-medium">Reflexão do dia</span>
                  <span className="text-muted-foreground text-sm">
                    {sessionStatus(
                      sourceSessionIds.has(session.id),
                      commentSessionIds.has(session.id),
                    )}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Nenhuma sessão criada hoje ainda. Comece uma nova reflexão.
        </p>
      )}
    </div>
  );
}
