import Link from "next/link";
import { getSession } from "@/lib/dal";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/admin" className="font-semibold">
            Tabroom Admin
          </Link>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{session?.user?.name}</span>
            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
