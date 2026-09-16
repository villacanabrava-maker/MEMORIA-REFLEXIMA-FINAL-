"use client";

import { useActionState } from "react";

import { saveComment, type ActionState } from "@/app/(protected)/reflexoes/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CommentFormProps = {
  sessionId: string;
  defaultValues?: {
    body: string;
  };
};

export function CommentForm({ sessionId, defaultValues }: CommentFormProps) {
  const action = saveComment.bind(null, sessionId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="comment-body">Seu comentário</Label>
        <Textarea
          id="comment-body"
          name="body"
          rows={8}
          defaultValue={defaultValues?.body}
          aria-invalid={!!state?.fieldErrors?.body}
          required
        />
        {state?.fieldErrors?.body && (
          <p className="text-destructive text-sm">{state.fieldErrors.body[0]}</p>
        )}
      </div>

      {state?.error && <p className="text-destructive text-sm">{state.error}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Salvando..." : "Salvar comentário"}
      </Button>
    </form>
  );
}
