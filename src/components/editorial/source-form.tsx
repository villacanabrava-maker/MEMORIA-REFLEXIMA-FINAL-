"use client";

import { useActionState } from "react";

import { saveSource, type ActionState } from "@/app/(protected)/reflexoes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SourceFormProps = {
  sessionId: string;
  defaultValues?: {
    title: string;
    sourceDate: string;
    author: string | null;
    body: string;
  };
};

export function SourceForm({ sessionId, defaultValues }: SourceFormProps) {
  const action = saveSource.bind(null, sessionId);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          name="title"
          defaultValue={defaultValues?.title}
          aria-invalid={!!state?.fieldErrors?.title}
          required
        />
        {state?.fieldErrors?.title && (
          <p className="text-destructive text-sm">{state.fieldErrors.title[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="sourceDate">Data da fonte</Label>
        <Input
          id="sourceDate"
          name="sourceDate"
          type="date"
          defaultValue={defaultValues?.sourceDate}
          aria-invalid={!!state?.fieldErrors?.sourceDate}
          required
        />
        {state?.fieldErrors?.sourceDate && (
          <p className="text-destructive text-sm">
            {state.fieldErrors.sourceDate[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="author">Autoria / fonte</Label>
        <Input id="author" name="author" defaultValue={defaultValues?.author ?? ""} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="body">Texto recebido</Label>
        <Textarea
          id="body"
          name="body"
          rows={10}
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
        {pending ? "Salvando..." : "Salvar fonte"}
      </Button>
    </form>
  );
}
