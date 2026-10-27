import Link from "next/link";
import type { Person } from "@/lib/types";
import { Avatar } from "./ui";

export function subtitle(p: Person) {
  return [p.role, p.company].filter(Boolean).join(" · ") || p.location || p.howWeMet || "No details yet";
}

export function PersonRow({
  person,
  detail,
  right,
  link = true,
}: {
  person: Person;
  detail?: React.ReactNode;
  right?: React.ReactNode;
  /** Set false when the row already sits inside a link. */
  link?: boolean;
}) {
  const body = (
    <>
      <Avatar person={person} size={40} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{person.name}</span>
        <span className="block truncate text-xs text-muted">{detail ?? subtitle(person)}</span>
      </span>
    </>
  );
  return (
    <div className="flex items-center gap-3 py-2.5">
      {link ? (
        <Link href={`/app/people/${person.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          {body}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{body}</div>
      )}
      {right}
    </div>
  );
}
