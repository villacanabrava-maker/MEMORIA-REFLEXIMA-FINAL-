"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { commentSchema, sourceSchema } from "@/lib/validation/editorial";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
} | null;

export async function createSession(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const sessionDate =
    String(formData.get("sessionDate") || "") ||
    new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("reflection_sessions")
    .insert({ user_id: user.id, session_date: sessionDate })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Não foi possível criar a sessão.");
  }

  redirect(`/reflexoes/${data.id}`);
}

async function getOwnedSession(sessionId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reflection_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  return data;
}

export async function saveSource(
  sessionId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const parsed = sourceSchema.safeParse({
    title: formData.get("title"),
    sourceDate: formData.get("sourceDate"),
    author: formData.get("author") || undefined,
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const session = await getOwnedSession(sessionId, user.id);
  if (!session) {
    return { error: "Sessão não encontrada." };
  }

  const { error } = await supabase.from("daily_sources").upsert(
    {
      session_id: sessionId,
      user_id: user.id,
      title: parsed.data.title,
      source_date: parsed.data.sourceDate,
      author: parsed.data.author || null,
      body: parsed.data.body,
    },
    { onConflict: "session_id" },
  );

  if (error) {
    return { error: "Não foi possível salvar a fonte." };
  }

  revalidatePath(`/reflexoes/${sessionId}`);
  revalidatePath("/inicio");
  return null;
}

export async function saveComment(
  sessionId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const parsed = commentSchema.safeParse({
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const session = await getOwnedSession(sessionId, user.id);
  if (!session) {
    return { error: "Sessão não encontrada." };
  }

  const { error } = await supabase.from("reflection_comments").upsert(
    {
      session_id: sessionId,
      user_id: user.id,
      body: parsed.data.body,
    },
    { onConflict: "session_id" },
  );

  if (error) {
    return { error: "Não foi possível salvar o comentário." };
  }

  revalidatePath(`/reflexoes/${sessionId}`);
  revalidatePath("/inicio");
  return null;
}
