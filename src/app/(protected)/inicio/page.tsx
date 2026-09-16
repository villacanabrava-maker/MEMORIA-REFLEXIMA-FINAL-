import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Início — Memória Reflexiva",
};

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

  const today = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  return (
    <div className="flex flex-col gap-2 px-6 py-10">
      <p className="text-muted-foreground text-sm capitalize">{today}</p>
      <h1 className="text-2xl font-semibold">
        Olá, {profile?.display_name ?? user?.email}
      </h1>
      <p className="text-muted-foreground max-w-prose text-sm">
        O painel de sessões do dia, a criação de novas reflexões e o
        histórico serão construídos nos próximos lotes deste projeto.
      </p>
    </div>
  );
}
