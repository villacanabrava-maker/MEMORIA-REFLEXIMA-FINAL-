import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
        Memória Reflexiva
      </p>
      <h1 className="max-w-xl text-3xl font-semibold text-balance sm:text-4xl">
        Uma reflexão autoral diária, com apoio de IA e aprovação humana
      </h1>
      <p className="text-muted-foreground max-w-md text-sm sm:text-base">
        Cadastre uma fonte, escreva ou grave um comentário e revise a reflexão
        gerada antes de aprová-la. Você continua sendo a autora ou o autor.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/login">Entrar</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/cadastro">Criar conta</Link>
        </Button>
      </div>
    </main>
  );
}
