"use client";

import { useActionState } from "react";

import { uploadMemory, type UploadState } from "@/app/(protected)/memoria/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MemoryUploadForm() {
  const [state, formAction, pending] = useActionState<UploadState, FormData>(
    uploadMemory,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="file">Arquivo (.txt ou .md, até 2 MB)</Label>
        <Input id="file" name="file" type="file" accept=".txt,.md,.markdown" required />
      </div>

      {state?.error && <p className="text-destructive text-sm">{state.error}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Processando..." : "Importar memória"}
      </Button>
    </form>
  );
}
