import type { Circle, FrenData, FrenEvent, Note, Person, Platform, Source } from "./types";
import { hueFor } from "./utils";

const ago = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

/** MM-DD for a date `days` from today, so demo birthdays are always upcoming. */
const inDays = (days: number) => {
  const d = new Date(Date.now() + days * 86_400_000);
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

interface SeedPerson {
  id: string;
  name: string;
  role?: string;
  company?: string;
  location?: string;
  howWeMet?: string;
  eventId?: string;
  metDaysAgo: number;
  introducedBy?: string;
  circle: Circle;
  tags?: string[];
  interests?: string[];
  accounts?: [Platform, string][];
  connections?: string[];
  birthdayIn?: number;
  cadenceDays?: number;
  lastContactDaysAgo?: number;
  sources: Source[];
  starred?: boolean;
  voice?: string;
  notes?: [string, number][];
}

const events: FrenEvent[] = [
  { id: "ev-websummit", name: "Web Summit Lisbon", date: ago(12), location: "Lisbon" },
  { id: "ev-climate", name: "Climate Tech Mixer", date: ago(40), location: "Amsterdam" },
  { id: "ev-maya-bday", name: "Maya's birthday dinner", date: ago(75), location: "Rotterdam" },
  { id: "ev-hack", name: "AI Hack Night", date: ago(3), location: "Berlin" },
];

const seedPeople: SeedPerson[] = [
  {
    id: "p-maya", name: "Maya Lindqvist", role: "Product designer", company: "Mollie", location: "Rotterdam",
    howWeMet: "Roommate in second year of uni. Still the first person I call.", metDaysAgo: 2400, circle: "inner",
    tags: ["uni", "design"], interests: ["ceramics", "bouldering", "Studio Ghibli"],
    accounts: [["instagram", "maya.makes"], ["linkedin", "mayalindqvist"], ["phone", "+31 6 1234 5678"]],
    connections: ["p-jonas", "p-sofia", "p-ines"], birthdayIn: 9, cadenceDays: 14, lastContactDaysAgo: 20,
    sources: ["contacts", "instagram"], starred: true,
    notes: [["Started a pottery class on Thursdays. Ask how the first bowl turned out.", 20]],
  },
  {
    id: "p-jonas", name: "Jonas Becker", role: "Backend engineer", company: "N26", location: "Berlin",
    howWeMet: "Maya's partner. Met at her birthday dinner, talked for an hour about sourdough.", eventId: "ev-maya-bday",
    metDaysAgo: 75, introducedBy: "p-maya", circle: "friends", tags: ["berlin"], interests: ["sourdough", "cycling", "Rust"],
    accounts: [["github", "jbecker"], ["x", "jonasbakes"]], connections: ["p-maya", "p-lena"], cadenceDays: 60,
    lastContactDaysAgo: 70, sources: ["voice"],
    voice: "Met Jonas at Maya's birthday dinner, he's her partner, backend engineer at N26 in Berlin, obsessed with sourdough and cycling. Github jbecker.",
  },
  {
    id: "p-amara", name: "Amara Okafor", role: "Founder", company: "Gridlight", location: "Lisbon",
    howWeMet: "Asked a sharp question at the energy storage panel. Building battery-sharing for apartment blocks.",
    eventId: "ev-websummit", metDaysAgo: 12, circle: "work", tags: ["founder", "climate", "investor-intro"],
    interests: ["energy storage", "Afrobeats", "trail running"], accounts: [["linkedin", "amaraokafor"], ["x", "amarabuilds"], ["email", "amara@gridlight.io"]],
    connections: ["p-tomas", "p-daniel"], cadenceDays: 30, lastContactDaysAgo: 12, sources: ["voice", "linkedin"], starred: true,
    voice: "Just met Amara Okafor at Web Summit, founder of Gridlight, battery sharing for apartment blocks. She knows Tomas. Wants an intro to Daniel for her seed round. Follow up next week.",
    notes: [["Promised an intro to Daniel for her seed round.", 12]],
  },
  {
    id: "p-tomas", name: "Tomás Ribeiro", role: "Climate VC", company: "Nova Ventures", location: "Lisbon",
    howWeMet: "Hosted the Climate Tech Mixer. Gave me his card on a recycled coaster.", eventId: "ev-climate",
    metDaysAgo: 40, circle: "work", tags: ["investor", "climate"], interests: ["surfing", "fado", "carbon markets"],
    accounts: [["linkedin", "tomasribeiro"], ["email", "tomas@nova.vc"]], connections: ["p-amara", "p-daniel"],
    cadenceDays: 90, lastContactDaysAgo: 40, sources: ["voice", "email"],
  },
  {
    id: "p-daniel", name: "Daniel Kim", role: "Partner", company: "Seedcamp", location: "London",
    howWeMet: "Ex-colleague from my first startup job. Now invests in pre-seed.", metDaysAgo: 1500, circle: "work",
    tags: ["investor", "ex-colleague"], interests: ["chess", "K-dramas", "fintech"],
    accounts: [["linkedin", "danielkim"], ["x", "dkim_vc"], ["email", "daniel@seedcamp.com"]], connections: ["p-tomas", "p-amara", "p-priya"],
    birthdayIn: 23, cadenceDays: 90, lastContactDaysAgo: 120, sources: ["linkedin", "email", "contacts"],
  },
  {
    id: "p-sofia", name: "Sofia Marchetti", role: "Illustrator", location: "Milan",
    howWeMet: "Sat next to me on the night train to Vienna. Drew my portrait on a napkin.", metDaysAgo: 400,
    circle: "friends", tags: ["travel", "art"], interests: ["risograph", "night trains", "jazz"],
    accounts: [["instagram", "sofia.draws"], ["website", "sofiamarchetti.it"]], connections: ["p-maya"],
    birthdayIn: 3, cadenceDays: 90, lastContactDaysAgo: 95, sources: ["instagram", "voice"],
  },
  {
    id: "p-lena", name: "Lena Vogel", role: "ML researcher", company: "Aleph Alpha", location: "Berlin",
    howWeMet: "Teammate at AI Hack Night. Built a voice-to-graph demo in 4 hours together.", eventId: "ev-hack",
    metDaysAgo: 3, circle: "acquaintance", tags: ["ai", "hackathon"], interests: ["speech models", "climbing"],
    accounts: [["github", "lenavogel"], ["linkedin", "lena-vogel"]], connections: ["p-jonas", "p-kai"],
    sources: ["voice"], cadenceDays: 30,
    voice: "Lena Vogel from AI Hack Night, ML researcher at Aleph Alpha, we built a voice to graph demo together. She knows Jonas from climbing. Github lenavogel.",
  },
  {
    id: "p-kai", name: "Kai Nakamura", role: "Designer", company: "Figma", location: "Berlin",
    howWeMet: "Judge at AI Hack Night, liked our demo and asked for the repo.", eventId: "ev-hack", metDaysAgo: 3,
    introducedBy: "p-lena", circle: "acquaintance", tags: ["design", "hackathon"], interests: ["type design", "synths"],
    accounts: [["x", "kainaka"], ["instagram", "kai.nkm"]], connections: ["p-lena"], sources: ["voice"],
  },
  {
    id: "p-priya", name: "Priya Raman", role: "Head of Growth", company: "Bolt", location: "Tallinn",
    howWeMet: "Daniel introduced us over email about growth loops.", metDaysAgo: 210, introducedBy: "p-daniel",
    circle: "work", tags: ["growth", "mentor"], interests: ["sauna", "behavioural econ"],
    accounts: [["linkedin", "priyaraman"], ["email", "priya@bolt.eu"]], connections: ["p-daniel"], cadenceDays: 60,
    lastContactDaysAgo: 30, sources: ["email", "linkedin"],
  },
  {
    id: "p-ines", name: "Inês Costa", role: "Architect", location: "Porto", howWeMet: "Maya's cousin, hosted us in Porto last summer.",
    metDaysAgo: 460, introducedBy: "p-maya", circle: "friends", tags: ["travel"], interests: ["azulejos", "wine", "tennis"],
    accounts: [["instagram", "ines.costa"], ["whatsapp", "+351 912 345 678"]], connections: ["p-maya"], birthdayIn: 41,
    cadenceDays: 180, lastContactDaysAgo: 150, sources: ["instagram", "contacts"],
  },
  {
    id: "p-oli", name: "Oliver Grant", role: "Barista & DJ", location: "Amsterdam",
    howWeMet: "Runs the coffee cart outside the office. Plays house sets on Fridays.", metDaysAgo: 300,
    circle: "acquaintance", tags: ["neighbourhood"], interests: ["vinyl", "house music"], accounts: [["instagram", "oli.spins"]],
    sources: ["manual"],
  },
  {
    id: "p-nadia", name: "Nadia Haddad", role: "Journalist", company: "Sifted", location: "London",
    howWeMet: "Interviewed me for a piece on personal CRMs. Swapped book recs.", eventId: "ev-websummit", metDaysAgo: 11,
    circle: "acquaintance", tags: ["press"], interests: ["Ursula K. Le Guin", "startups"],
    accounts: [["x", "nadiawrites"], ["email", "nadia@sifted.eu"]], connections: ["p-daniel", "p-amara"], cadenceDays: 60,
    sources: ["voice", "x"],
  },
];

function build(s: SeedPerson): Person {
  const notes: Note[] = (s.notes ?? []).map(([text, d], i) => ({ id: `${s.id}-n${i}`, kind: "text", text, createdAt: ago(d) }));
  if (s.voice) notes.push({ id: `${s.id}-v`, kind: "voice", text: s.voice, createdAt: ago(s.metDaysAgo) });
  return {
    id: s.id,
    name: s.name,
    hue: hueFor(s.name),
    role: s.role,
    company: s.company,
    location: s.location,
    howWeMet: s.howWeMet,
    eventId: s.eventId,
    metOn: ago(s.metDaysAgo),
    introducedBy: s.introducedBy,
    circle: s.circle,
    tags: s.tags ?? [],
    interests: s.interests ?? [],
    accounts: (s.accounts ?? []).map(([platform, handle]) => ({ platform, handle })),
    connections: s.connections ?? [],
    birthday: s.birthdayIn !== undefined ? inDays(s.birthdayIn) : undefined,
    cadenceDays: s.cadenceDays,
    lastContactedAt: s.lastContactDaysAgo !== undefined ? ago(s.lastContactDaysAgo) : undefined,
    notes: notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    sources: s.sources,
    starred: s.starred,
    createdAt: ago(s.metDaysAgo),
  };
}

export function demoData(): FrenData {
  return { version: 1, me: { name: "You" }, people: seedPeople.map(build), events, recall: {} };
}

export function emptyData(): FrenData {
  return { version: 1, me: { name: "You" }, people: [], events: [], recall: {} };
}
