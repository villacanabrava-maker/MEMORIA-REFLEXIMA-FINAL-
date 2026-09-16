import type { Metadata } from "next";

import { createSession } from "@/app/(protected)/reflexoes/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Nova reflexão — Memória Reflexiva",
};

export default function NovaReflexaoPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-sm px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Nova reflexão</CardTitle>
          <CardDescription>
            Escolha o dia desta reflexão. Você poderá cadastrar a fonte e o
            comentário na sequência.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createSession} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sessionDate">Data</Label>
              <Input
                id="sessionDate"
                name="sessionDate"
                type="date"
                defaultValue={today}
                required
              />
            </div>
            <Button type="submit">Começar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
