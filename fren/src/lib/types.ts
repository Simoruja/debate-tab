export type Platform =
  | "instagram"
  | "linkedin"
  | "x"
  | "tiktok"
  | "facebook"
  | "github"
  | "whatsapp"
  | "telegram"
  | "email"
  | "phone"
  | "website";

export type Source =
  | "voice"
  | "manual"
  | "contacts"
  | "email"
  | "linkedin"
  | "instagram"
  | "x";

export type Circle = "inner" | "friends" | "work" | "acquaintance";

export interface Account {
  platform: Platform;
  handle: string;
}

export type NoteKind = "voice" | "text" | "call" | "meetup" | "message";

export interface Note {
  id: string;
  kind: NoteKind;
  text: string;
  createdAt: string;
}

export interface Person {
  id: string;
  name: string;
  hue: number;
  role?: string;
  company?: string;
  location?: string;
  /** Free-text memory: "Sat next to me at the climate panel, laughed at my joke". */
  howWeMet?: string;
  eventId?: string;
  metOn?: string;
  introducedBy?: string;
  circle: Circle;
  tags: string[];
  interests: string[];
  accounts: Account[];
  /** Ids of other people this person knows. Edges are stored on both sides. */
  connections: string[];
  birthday?: string; // MM-DD
  cadenceDays?: number;
  lastContactedAt?: string;
  notes: Note[];
  sources: Source[];
  starred?: boolean;
  createdAt: string;
}

export interface FrenEvent {
  id: string;
  name: string;
  date: string;
  location?: string;
}

export interface FrenData {
  version: 1;
  me: { name: string };
  people: Person[];
  events: FrenEvent[];
  recall: Record<string, { seen: number; correct: number; lastSeen: string }>;
}

/** What a voice note turns into before the user confirms it. */
export interface ExtractedPerson {
  name: string;
  role: string | null;
  company: string | null;
  location: string | null;
  howWeMet: string | null;
  eventName: string | null;
  introducedBy: string | null;
  interests: string[];
  accounts: Account[];
  mentions: string[];
  followUpDays: number | null;
  birthday: string | null;
}

export interface Extraction {
  people: ExtractedPerson[];
  summary: string;
  engine: "claude" | "on-device";
}
