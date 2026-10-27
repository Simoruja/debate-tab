import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Extraction } from "@/lib/types";

const PersonSchema = z.object({
  name: z.string().describe("Full name as said; first name only if that is all that was said"),
  role: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().nullable().describe("City or area they live/work in"),
  howWeMet: z.string().nullable().describe("One or two sentences, first person, capturing the memorable details of meeting them"),
  eventName: z.string().nullable().describe("Event, venue or occasion where we met"),
  introducedBy: z.string().nullable().describe("Name of whoever introduced us, if said"),
  interests: z.array(z.string()).describe("Short lowercase interests or conversation topics"),
  accounts: z.array(
    z.object({
      platform: z.enum(["instagram", "linkedin", "x", "tiktok", "facebook", "github", "whatsapp", "telegram", "email", "phone", "website"]),
      handle: z.string().describe("Handle without @, or the email/phone/url"),
    }),
  ),
  mentions: z.array(z.string()).describe("Names from KNOWN CONTACTS this person knows or was mentioned alongside"),
  followUpDays: z.number().int().nullable().describe("Days from now to follow up, if a follow-up was implied"),
  birthday: z.string().nullable().describe("MM-DD if a birthday was mentioned"),
});

const ExtractionSchema = z.object({
  people: z.array(PersonSchema).describe("Every new person the speaker met or talked about, primary person first"),
  summary: z.string().describe("Under 12 words, e.g. 'Amara (Gridlight founder) at Web Summit'"),
});

const SYSTEM = `You turn quick voice notes about people into structured contact cards for a private personal relationship manager called FREN.
Voice notes are speech-to-text: expect missing punctuation, lowercase names and misheard words; fix obvious transcription errors in names using KNOWN CONTACTS.
Only include facts the speaker actually said. Use null or [] for anything not mentioned. Never invent handles.
If the speaker talks about someone already in KNOWN CONTACTS (e.g. catching up with them), still include them using the exact known name.`;

// The GET status depends on runtime env vars, so never prerender it.
export const dynamic = "force-dynamic";

const enabled = () => !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

/** Lets the settings page show whether AI parsing is switched on. */
export async function GET() {
  return Response.json({ enabled: enabled() });
}

export async function POST(request: Request) {
  if (!enabled()) {
    return Response.json({ error: "AI parsing is not configured" }, { status: 501 });
  }

  const body = (await request.json().catch(() => null)) as { transcript?: string; known?: string[]; events?: string[] } | null;
  const transcript = body?.transcript?.trim();
  if (!transcript) return Response.json({ error: "Empty transcript" }, { status: 400 });

  const known = (body?.known ?? []).slice(0, 500).join(", ") || "(none)";
  const events = (body?.events ?? []).slice(0, 100).join(", ") || "(none)";

  const client = new Anthropic();
  try {
    const response = await client.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      output_config: { effort: "low", format: zodOutputFormat(ExtractionSchema) },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `KNOWN CONTACTS: ${known}\nKNOWN EVENTS: ${events}\n\nVOICE NOTE:\n${transcript}`,
        },
      ],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return Response.json({ error: "Could not parse this note" }, { status: 422 });
    }
    const result: Extraction = { ...response.parsed_output, engine: "claude" };
    return Response.json(result);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "Rate limited, try again shortly" }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      return Response.json({ error: `Claude API error ${error.status}` }, { status: 502 });
    }
    throw error;
  }
}
