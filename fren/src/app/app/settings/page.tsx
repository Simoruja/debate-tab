"use client";

import { Cpu, Download, HardDrive, RotateCcw, ShieldCheck, Sparkles, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Loading, PageHeader } from "@/components/ui";
import { actions, useFren } from "@/lib/store";
import type { FrenData } from "@/lib/types";

export default function SettingsPage() {
  const data = useFren();
  const file = useRef<HTMLInputElement>(null);
  const [ai, setAi] = useState<boolean | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/extract")
      .then((r) => r.json())
      .then((j: { enabled: boolean }) => setAi(j.enabled))
      .catch(() => setAi(false));
  }, []);

  if (!data) return <Loading />;
  const bytes = new Blob([JSON.stringify(data)]).size;

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `fren-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function restore(f?: File) {
    if (!f) return;
    try {
      const parsed = JSON.parse(await f.text()) as FrenData;
      if (parsed.version !== 1 || !Array.isArray(parsed.people)) throw new Error();
      actions.replace(parsed);
      setMsg(`Restored ${parsed.people.length} people.`);
    } catch {
      setMsg("That isn’t a FREN backup file.");
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Privacy & data" subtitle="FREN is a private layer on top of your social apps. You own all of it." />

      <section className="card mb-4 p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
          <ShieldCheck size={18} className="text-mint-500" /> Where your data lives
        </h2>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2">
            <HardDrive size={16} className="mt-0.5 shrink-0 text-muted" />
            Everything is stored in this browser on this device ({(bytes / 1024).toFixed(1)} KB). There’s no FREN account and no server copy.
          </li>
          <li className="flex gap-2">
            <Cpu size={16} className="mt-0.5 shrink-0 text-muted" />
            {ai === null
              ? "Checking voice-note parsing…"
              : ai
                ? "AI parsing is on: when you turn a voice note into a card, the transcript and your contacts’ names are sent to Claude to extract details. Nothing is stored there."
                : "Voice notes are parsed on your device. To get smarter parsing, set ANTHROPIC_API_KEY on the server."}
          </li>
          <li className="flex gap-2">
            <Sparkles size={16} className="mt-0.5 shrink-0 text-muted" />
            Speech-to-text uses your browser’s built-in recognizer. In Chrome that runs through Google’s speech service; in Safari it runs on Apple’s.
          </li>
        </ul>
      </section>

      <section className="card mb-4 p-5">
        <label className="label" htmlFor="me">
          Your name (centre of your graph)
        </label>
        <input id="me" className="input" value={data.me.name} onChange={(e) => actions.setMyName(e.target.value)} />
      </section>

      <section className="card mb-4 p-5">
        <h2 className="mb-1 font-display text-lg font-semibold">Backup</h2>
        <p className="mb-4 text-sm text-muted">Export everything as a JSON file, or restore one from another device.</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={exportData}>
            <Download size={16} /> Export backup
          </button>
          <button className="btn-ghost" onClick={() => file.current?.click()}>
            <Upload size={16} /> Restore backup
          </button>
          <input ref={file} type="file" accept=".json" className="hidden" onChange={(e) => restore(e.target.files?.[0])} />
        </div>
        {msg && <p className="mt-3 text-sm text-muted">{msg}</p>}
      </section>

      <section className="card border-coral-200 p-5">
        <h2 className="mb-1 font-display text-lg font-semibold">Start over</h2>
        <p className="mb-4 text-sm text-muted">The app starts with demo people so you can explore. Clear them when you’re ready to use FREN for real.</p>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-ghost"
            onClick={() => {
              if (confirm("Replace everything with the demo network?")) actions.reset("demo");
            }}
          >
            <RotateCcw size={16} /> Reload demo data
          </button>
          <button
            className="btn bg-coral-50 text-coral-700 hover:bg-coral-100"
            onClick={() => {
              if (confirm("Delete every person, note and event on this device? Export a backup first if you want to keep them.")) actions.reset("empty");
            }}
          >
            <Trash2 size={16} /> Clear everything
          </button>
        </div>
      </section>
    </div>
  );
}
