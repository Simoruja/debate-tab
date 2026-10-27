import type { NewPerson } from "./store";
import type { Account, Source } from "./types";

/** Minimal RFC 4180 CSV parser (quotes, escaped quotes, CRLF). */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => x.trim()));
}

function linkedinHandle(url: string) {
  return /linkedin\.com\/in\/([^/?#]+)/i.exec(url)?.[1] ?? url;
}

/**
 * Handles LinkedIn "Connections.csv", Google/Outlook contact exports and any
 * CSV with recognisable headers.
 */
export function fromCSV(text: string): { people: NewPerson[]; kind: string } {
  const rows = parseCSV(text.replace(/^﻿/, ""));
  // LinkedIn prefixes the export with a few "Notes:" lines before the header.
  const headerIdx = rows.findIndex((r) => r.some((c) => /^(first name|name|given name|full name)$/i.test(c.trim())));
  if (headerIdx < 0) return { people: [], kind: "unknown" };
  const header = rows[headerIdx].map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) => header.findIndex((h) => names.includes(h));
  const isLinkedIn = header.includes("connected on") || header.includes("url") && header.includes("position");
  const source: Source = isLinkedIn ? "linkedin" : "contacts";

  const iFirst = col("first name", "given name");
  const iLast = col("last name", "family name");
  const iName = col("name", "full name", "display name");
  const iEmail = header.findIndex((h) => h === "email address" || h === "email" || /^e-?mail 1 - value$/.test(h) || h === "e-mail address");
  const iPhone = header.findIndex((h) => h === "phone" || h === "mobile phone" || /^phone 1 - value$/.test(h));
  const iCompany = col("company", "organization 1 - name", "organization name", "company name");
  const iRole = col("position", "title", "job title", "organization 1 - title", "organization title");
  const iUrl = col("url", "profile url");
  const iBday = col("birthday");
  const iConnected = col("connected on");

  const people: NewPerson[] = [];
  for (const r of rows.slice(headerIdx + 1)) {
    const get = (i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
    const name = [get(iFirst), get(iLast)].filter(Boolean).join(" ") || get(iName);
    if (!name) continue;
    const accounts: Account[] = [];
    if (get(iEmail)) accounts.push({ platform: "email", handle: get(iEmail) });
    if (get(iPhone)) accounts.push({ platform: "phone", handle: get(iPhone).split(" ::: ")[0] });
    if (get(iUrl)) accounts.push({ platform: "linkedin", handle: linkedinHandle(get(iUrl)) });
    const bday = /(\d{2})-(\d{2})$/.exec(get(iBday));
    const connected = get(iConnected) ? new Date(get(iConnected)) : null;
    people.push({
      name,
      company: get(iCompany) || undefined,
      role: get(iRole) || undefined,
      accounts,
      birthday: bday ? `${bday[1]}-${bday[2]}` : undefined,
      metOn: connected && !isNaN(connected.getTime()) ? connected.toISOString() : undefined,
      howWeMet: isLinkedIn ? "Connected on LinkedIn" : undefined,
      circle: isLinkedIn ? "work" : "acquaintance",
      sources: [source],
    });
  }
  return { people, kind: isLinkedIn ? "LinkedIn connections" : "contacts CSV" };
}

/** Phone / iCloud / Google .vcf export. */
export function fromVCard(text: string): NewPerson[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  const cards = unfolded.split(/BEGIN:VCARD/i).slice(1);
  const out: NewPerson[] = [];
  for (const card of cards) {
    const lines = card.split(/\r?\n/);
    const val = (key: string) =>
      lines
        .filter((l) => new RegExp(`^(?:item\\d+\\.)?${key}[;:]`, "i").test(l))
        .map((l) => l.slice(l.indexOf(":") + 1).replace(/\\,/g, ",").replace(/\\n/g, " ").trim());
    let name = val("FN")[0];
    if (!name) {
      const n = val("N")[0]?.split(";") ?? [];
      name = [n[1], n[0]].filter(Boolean).join(" ");
    }
    if (!name) continue;
    const accounts: Account[] = [
      ...val("EMAIL").map((h) => ({ platform: "email" as const, handle: h })),
      ...val("TEL").map((h) => ({ platform: "phone" as const, handle: h })),
    ];
    for (const url of [...val("URL"), ...val("X-SOCIALPROFILE")]) {
      const m = /(instagram|linkedin|twitter|x|github|tiktok|facebook)\.com\/(?:in\/)?([^/?#]+)/i.exec(url);
      if (m) {
        const p = m[1].toLowerCase();
        accounts.push({ platform: (p === "twitter" ? "x" : p) as Account["platform"], handle: m[2] });
      } else if (url) accounts.push({ platform: "website", handle: url });
    }
    const org = val("ORG")[0]?.split(";")[0];
    const bday = /(\d{2})-?(\d{2})$/.exec(val("BDAY")[0] ?? "");
    out.push({
      name,
      company: org || undefined,
      role: val("TITLE")[0] || undefined,
      accounts,
      birthday: bday ? `${bday[1]}-${bday[2]}` : undefined,
      howWeMet: val("NOTE")[0] || undefined,
      sources: ["contacts"],
    });
  }
  return out;
}

/** Instagram "Download your information" → followers_1.json / following.json. */
export function fromInstagram(json: unknown): NewPerson[] {
  const list: unknown[] = Array.isArray(json)
    ? json
    : (Object.values(json as Record<string, unknown>).find(Array.isArray) as unknown[] | undefined) ?? [];
  const out: NewPerson[] = [];
  for (const item of list) {
    const entry = (item as { string_list_data?: { value?: string }[]; title?: string }) ?? {};
    const handle = entry.string_list_data?.[0]?.value ?? entry.title;
    if (!handle) continue;
    out.push({ name: handle, accounts: [{ platform: "instagram", handle }], sources: ["instagram"], howWeMet: "Follow each other on Instagram" });
  }
  return out;
}

export async function parseFile(file: File): Promise<{ people: NewPerson[]; kind: string }> {
  const text = await file.text();
  const name = file.name.toLowerCase();
  if (name.endsWith(".vcf") || /BEGIN:VCARD/i.test(text.slice(0, 200))) return { people: fromVCard(text), kind: "phone contacts" };
  if (name.endsWith(".json")) return { people: fromInstagram(JSON.parse(text)), kind: "Instagram connections" };
  return fromCSV(text);
}
