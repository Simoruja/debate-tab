import type { Account, ExtractedPerson, Extraction, Platform } from "./types";
import { normalize } from "./utils";

/**
 * On-device parser for voice notes. It is deliberately rule-based so FREN
 * works with zero setup and nothing leaves the browser; when an API key is
 * configured, /api/extract asks Claude instead and this is the fallback.
 */

const NAME = "[A-Z][\\p{L}'’-]+(?:\\s+(?:van|de|da|von|der|del|la|le)?\\s*[A-Z][\\p{L}'’-]+){0,2}";

const NOT_NAMES = new Set(
  "I Im I'm The A An At In On And But So We He She They It This That Today Yesterday Tonight Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July August September October November December Just Also Then Really Met Follow Instagram LinkedIn Linkedin Twitter Github GitHub TikTok Telegram Whatsapp WhatsApp Email".split(
    " ",
  ),
);

const ROLE_WORDS =
  "co-?founder|founder|ceo|cto|coo|cfo|vp|head of [a-z]+|director|partner|investor|vc|engineer|developer|designer|product manager|pm|researcher|scientist|student|phd student|professor|teacher|doctor|nurse|lawyer|journalist|writer|artist|illustrator|photographer|musician|dj|chef|barista|architect|consultant|recruiter|marketer|analyst|manager|intern|founder|organi[sz]er|producer|filmmaker|model|athlete|coach";

const EVENT_WORDS =
  "summit|conference|conf|meetup|meet-up|party|dinner|lunch|brunch|wedding|hackathon|hack night|mixer|festival|gym|class|bar|caf[eé]|event|workshop|concert|retreat|game|match|club|demo day|launch|networking|talk|panel|bbq|barbecue|birthday";

const PLATFORM_ALIASES: Record<string, Platform> = {
  instagram: "instagram",
  insta: "instagram",
  ig: "instagram",
  linkedin: "linkedin",
  twitter: "x",
  x: "x",
  github: "github",
  tiktok: "tiktok",
  telegram: "telegram",
  facebook: "facebook",
};

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

function clean(s: string) {
  return s.replace(/\s+/g, " ").replace(/[\s,.;:]+$/, "").trim();
}

function titleCase(s: string) {
  return s.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

function trimName(raw: string) {
  const words = raw.split(/\s+/).filter((w) => !NOT_NAMES.has(w.replace(/['’]s$/, "")));
  return words.join(" ").replace(/['’]s$/, "");
}

/** Case-insensitive keyword alternation while the captured name stays case-sensitive. */
function ci(words: string) {
  return words.replace(/[a-z]/g, (c) => `[${c}${c.toUpperCase()}]`);
}

function findNames(text: string, known: { id: string; name: string }[]): string[] {
  const names: string[] = [];
  const push = (n: string) => {
    const t = trimName(clean(n));
    if (t && !names.some((x) => normalize(x) === normalize(t))) names.push(t);
  };

  const trigger = new RegExp(
    `\\b(?:${ci("met|meet|meeting|talked to|talking to|chatted with|spoke (?:to|with)|ran into|bumped into|this is|name is|named|called|caught up with|hung out with|introduced me to|say hi to")})\\s+(?:a\\s+(?:guy|girl|woman|man|person)\\s+(?:named|called)\\s+)?(${NAME})`,
    "gu",
  );
  for (const m of text.matchAll(trigger)) push(m[1]);

  // "...and her cofounder Tom", "and Sam"
  const andPattern = new RegExp(`\\band\\s+(?:(?:his|her|their)\\s+)?(?:[a-z-]+\\s+)?(${NAME})`, "gu");
  if (names.length) {
    for (const m of text.matchAll(andPattern)) {
      // Only treat it as a second person met when it continues the sentence that
      // introduced the first one ("Met Sarah and her cofounder Tom"). "She knows
      // Tomas and Maya" names existing contacts, which become mutuals instead.
      const sentence = text.slice(0, m.index).split(/[.!?]\s/).pop() ?? "";
      if (!names.some((n) => sentence.includes(n))) continue;
      if (/\b(?:at|in|from)\s*$/.test(sentence.slice(-12))) continue;
      if (matchKnown(trimName(m[1]), known)) continue;
      push(m[1]);
    }
  }

  // Sentence-initial "Lena Vogel from AI Hack Night ..."
  if (!names.length) {
    const lead = new RegExp(`^(${NAME})\\b`, "u").exec(text.trim());
    if (lead && lead[1].includes(" ")) push(lead[1]);
  }

  // Lower-case transcripts: "met sarah at ..." – take the word(s) after "met".
  if (!names.length) {
    const m = /\b(?:met|meet|named|called)\s+([a-z]+(?:\s+[a-z]+)?)/i.exec(text);
    if (m) {
      const words = m[1].split(" ").filter((w) => !["at", "a", "the", "with", "from", "in", "today", "up"].includes(w.toLowerCase()));
      if (words.length) push(titleCase(words[0]));
    }
  }
  return names;
}

function findRoleCompany(text: string): { role: string | null; company: string | null } {
  const org = "([A-Z0-9][\\w&.'’-]*(?:\\s+[A-Z0-9][\\w&.'’-]*){0,2})";
  let m = new RegExp(`\\b((?:[A-Z]{2,4}\\s+)?(?:${ROLE_WORDS}))\\s+(?:of|at|for|@)\\s+${org}`, "iu").exec(text);
  if (m) return { role: titleCase(m[1]), company: m[2] };
  m = new RegExp(`\\b(?:is|she's|he's|they're|works as)\\s+(?:a|an|the)\\s+([a-z][a-z -]{1,30}?)\\s+(?:at|for|@)\\s+${org}`, "u").exec(text);
  if (m) return { role: titleCase(m[1]), company: m[2] };
  m = new RegExp(`\\b(?:works? (?:at|for)|working at|employed at|runs|started)\\s+${org}`, "u").exec(text);
  const company = m ? m[1] : null;
  const r = new RegExp(`\\b(${ROLE_WORDS})\\b`, "i").exec(text);
  return { role: r ? titleCase(r[1]) : null, company };
}

function findEvent(text: string, company: string | null): string | null {
  const kw = new RegExp(
    `\\b(?:at|from)\\s+(?:the\\s+|a\\s+|an\\s+|this\\s+)?((?:[\\p{L}0-9'’&-]+\\s+){0,4}?(?:${EVENT_WORDS}))\\b`,
    "iu",
  ).exec(text);
  if (kw) return titleCase(clean(kw[1]).replace(/^(?:my|our|her|his|their)\s+/i, ""));
  const caps = /\bat\s+(?:the\s+)?([A-Z][\w'’-]*(?:\s+(?:[A-Z][\w'’-]*|of|and|&))*)/gu;
  for (const m of text.matchAll(caps)) {
    const candidate = clean(m[1]);
    if (company && candidate.startsWith(company)) continue;
    if (NOT_NAMES.has(candidate)) continue;
    return candidate;
  }
  return null;
}

function findLocation(text: string): string | null {
  const m = /\b(?:lives in|based in|moved to|living in|from|in)\s+([A-Z][\p{L}-]+(?:\s+[A-Z][\p{L}-]+)?)/gu;
  for (const hit of text.matchAll(m)) {
    const place = hit[1];
    if (MONTHS.includes(place.toLowerCase().split(" ")[0])) continue;
    // "from Aleph Alpha" is usually a company; keep "from" only for a single word.
    if (hit[0].startsWith("from") && place.includes(" ")) continue;
    return place;
  }
  return null;
}

function findInterests(text: string): string[] {
  const out: string[] = [];
  const re = /\b(?:into|loves?|likes?|obsessed with|passionate about|interested in|big fan of|fan of|plays|enjoys|nerds out about|talked about)\s+([^.;!?]+)/gi;
  for (const m of text.matchAll(re)) {
    const chunk = m[1].split(/\b(?:but|because|who|which|she|he|they|wants|follow)\b/i)[0];
    for (const part of chunk.split(/,|\band\b|&/)) {
      const t = clean(part).replace(/^(?:the|a|an)\s+/i, "");
      if (t && t.split(" ").length <= 4 && t.length > 2) out.push(t.toLowerCase());
    }
  }
  return [...new Set(out)].slice(0, 6);
}

function findAccounts(text: string): Account[] {
  const out: Account[] = [];
  const add = (platform: Platform, handle: string) => {
    const h = handle.replace(/^@/, "").replace(/[.,]$/, "");
    if (h.length > 1 && !out.some((a) => a.platform === platform && a.handle === h)) out.push({ platform, handle: h });
  };
  const re = /\b(instagram|insta|ig|linkedin|twitter|github|tiktok|telegram|facebook|x)\b(?:\s+(?:handle|is|account|username|at))?[\s:]+@?([A-Za-z0-9_.-]{2,40})/gi;
  for (const m of text.matchAll(re)) {
    if (["is", "and", "the", "too", "handle"].includes(m[2].toLowerCase())) continue;
    add(PLATFORM_ALIASES[m[1].toLowerCase()], m[2]);
  }
  for (const m of text.matchAll(/[\w.+-]+@[\w-]+\.[\w.]+/g)) add("email", m[0]);
  for (const m of text.matchAll(/(?:^|\s)@([A-Za-z0-9_.]{2,30})/g)) {
    if (!out.some((a) => a.handle === m[1])) add("instagram", m[1]);
  }
  for (const m of text.matchAll(/\+?\d[\d\s-]{7,}\d/g)) add("phone", m[0].trim());
  return out;
}

function findFollowUp(text: string): number | null {
  const t = text.toLowerCase();
  if (!/\b(follow up|follow-up|reach out|ping|text (?:her|him|them)|catch up|coffee|grab (?:a )?(?:drink|lunch|coffee)|send|intro)\b/.test(t)) return null;
  if (/\btomorrow\b/.test(t)) return 1;
  if (/\bnext week\b/.test(t)) return 7;
  if (/\bnext month\b/.test(t)) return 30;
  const n = /\bin (\d+|a|two|three|few) (day|week|month)s?\b/.exec(t);
  if (n) {
    const count = { a: 1, two: 2, three: 3, few: 3 }[n[1] as "a"] ?? Number(n[1]);
    return count * ({ day: 1, week: 7, month: 30 }[n[2] as "day"] ?? 1);
  }
  return 7;
}

function findBirthday(text: string): string | null {
  const m = new RegExp(`birthday(?: is)?(?: on)?(?: the)?\\s+(?:(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTHS.join("|")})|(${MONTHS.join("|")})\\s+(\\d{1,2}))`, "i").exec(text);
  if (!m) return null;
  const month = MONTHS.indexOf((m[2] ?? m[3]).toLowerCase()) + 1;
  const day = Number(m[1] ?? m[4]);
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function findIntroducer(text: string, known: { id: string; name: string }[]): string | null {
  const m =
    /\b(?:introduced by|intro from|through|via|friend of|thanks to)\s+([A-Z][\p{L}'’-]+(?:\s+[A-Z][\p{L}'’-]+)?)/u.exec(text) ??
    /\b([A-Z][\p{L}'’-]+)['’]s\s+(?:partner|friend|cousin|colleague|roommate|sister|brother|wife|husband|boyfriend|girlfriend|cofounder|co-founder|boss|teammate)\b/u.exec(text);
  if (!m) return null;
  const hit = matchKnown(m[1], known);
  return hit ? hit.name : m[1];
}

function matchKnown(fragment: string, known: { id: string; name: string }[]) {
  const f = normalize(fragment);
  const full = known.find((k) => normalize(k.name) === f);
  if (full) return full;
  const byFirst = known.filter((k) => normalize(k.name.split(" ")[0]) === f);
  return byFirst.length === 1 ? byFirst[0] : null;
}

function findMentions(text: string, known: { id: string; name: string }[], exclude: string[]): string[] {
  const words = text.split(/[^\p{L}'’]+/u).map((w) => normalize(w.replace(/['’]s$/, "")));
  const wordSet = new Set(words);
  const joined = " " + words.join(" ") + " ";
  const ex = new Set(exclude.map(normalize));
  const out: string[] = [];
  for (const k of known) {
    if (ex.has(normalize(k.name))) continue;
    const parts = k.name.split(/\s+/).map(normalize);
    const fullHit = joined.includes(" " + parts.join(" ") + " ");
    const firstUnique = known.filter((o) => normalize(o.name.split(" ")[0]) === parts[0]).length === 1;
    if (fullHit || (firstUnique && wordSet.has(parts[0]))) out.push(k.name);
  }
  return out;
}

function summarize(text: string) {
  const t = clean(text);
  return t.length > 220 ? t.slice(0, 217).replace(/\s+\S*$/, "") + "…" : t;
}

export function extractOnDevice(transcript: string, known: { id: string; name: string }[] = []): Extraction {
  const text = transcript.replace(/\s+/g, " ").trim();
  const names = findNames(text, known);
  const { role, company } = findRoleCompany(text);
  const eventName = findEvent(text, company);
  const shared = {
    location: findLocation(text),
    eventName,
    howWeMet: summarize(text),
  };

  const people: ExtractedPerson[] = names.map((name, i) => {
    const primary = i === 0;
    const mentions = findMentions(text, known, [name, ...names]);
    return {
      name,
      role: primary ? role : null,
      company: primary ? company : null,
      location: shared.location,
      howWeMet: shared.howWeMet,
      eventName: shared.eventName,
      introducedBy: primary ? findIntroducer(text, known) : names[0],
      interests: primary ? findInterests(text) : [],
      accounts: primary ? findAccounts(text) : [],
      // "She knows Tomas" describes the primary person; companions just know them.
      mentions: primary ? mentions : [],
      followUpDays: findFollowUp(text),
      birthday: primary ? findBirthday(text) : null,
    };
  });

  const summary = people.length
    ? `${people.map((p) => p.name).join(" & ")}${eventName ? ` · ${eventName}` : ""}`
    : "No name found. Try saying “Met <name> at <place>”.";
  return { people, summary, engine: "on-device" };
}

export { matchKnown };
