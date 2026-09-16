import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <Link
        href="/"
        className="text-muted-foreground mb-8 text-sm font-medium tracking-wide uppercase"
      >
        Memória Reflexiva
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
