import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { HapticLink } from "@/components/haptic-link";
import { TiltCard } from "@/components/tilt-card";
import { HeroChamber } from "@/components/three/hero-chamber";

const ACCENTS = ["border-l-gold", "border-l-green-accent", "border-l-navy"];

function formatDateRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString(
    "en-US",
    { ...opts, year: "numeric" },
  )}`;
}

export default async function Home() {
  // The directory reads live data; don't freeze it at build time.
  await connection();
  // If the database is unreachable (e.g. DATABASE_URL unset on a deployment),
  // still render the landing page instead of the error boundary.
  const result = await prisma.tournament
    .findMany({
      orderBy: { startDate: "desc" },
      include: { _count: { select: { teams: true } } },
    })
    .catch((error: unknown) => {
      console.error("Failed to load tournaments", error);
      return null;
    });
  const unavailable = result === null;
  const tournaments = result ?? [];
  const activeCount = tournaments.filter((t) => t.isActive).length;

  return (
    <div className="flex-1">
      <section className="relative overflow-hidden bg-navy px-4 pt-16 pb-8 text-cream sm:px-6 sm:pt-20 lg:py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(60% 50% at 15% 20%, rgba(196,144,48,0.25), transparent), radial-gradient(50% 40% at 90% 80%, rgba(61,112,96,0.25), transparent)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-4 lg:grid-cols-[1fr_1.1fr]">
          <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
            <span className="eyebrow text-gold">Tournament Directory</span>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-cream sm:text-6xl">
              Debates, <em className="font-serif italic text-gold">judged</em>{" "}
              and tallied with clarity
            </h1>
            <p className="mt-5 max-w-xl text-base text-cream/70">
              Browse active and past tournaments — rosters, rounds, and
              standings, all in one place.
            </p>
            {tournaments.length > 0 && (
              <div className="mt-8 flex gap-8 text-sm">
                <div>
                  <p className="font-serif text-3xl text-gold lining-nums">
                    {activeCount}
                  </p>
                  <p className="text-xs uppercase tracking-widest text-cream/60">
                    Active now
                  </p>
                </div>
                <div>
                  <p className="font-serif text-3xl text-cream lining-nums">
                    {tournaments.length}
                  </p>
                  <p className="text-xs uppercase tracking-widest text-cream/60">
                    Total tournaments
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="animate-in fade-in-0 zoom-in-95 duration-1000">
            <HeroChamber />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        {unavailable ? (
          <p className="text-muted-foreground">
            Tournaments can&apos;t be loaded right now. Please try again
            shortly.
          </p>
        ) : tournaments.length === 0 ? (
          <p className="text-muted-foreground">
            No tournaments have been created yet.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {tournaments.map((t, i) => (
              <TiltCard
                key={t.id}
                className="h-full animate-in fade-in-0 slide-in-from-bottom-2 rounded-lg"
                style={{
                  animationDelay: `${i * 60}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <HapticLink
                  href={`/tournaments/${t.slug}/standings`}
                  className={`group block h-full rounded-lg border border-l-4 bg-card p-6 shadow-sm transition-shadow duration-300 hover:shadow-xl active:duration-75 ${
                    ACCENTS[i % ACCENTS.length]
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-serif text-xl font-semibold text-foreground">
                      {t.name}
                    </h2>
                    <Badge variant={t.isActive ? "default" : "secondary"}>
                      {t.isActive ? "Active" : "Concluded"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t.format}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t pt-3 text-sm text-muted-foreground">
                    <span>{formatDateRange(t.startDate, t.endDate)}</span>
                    <span className="font-medium text-foreground transition-colors group-hover:text-gold">
                      {t._count.teams} teams &rarr;
                    </span>
                  </div>
                </HapticLink>
              </TiltCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
