"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal Web Speech API typings; not in lib.dom yet.
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type Ctor = new () => SpeechRecognitionLike;

function getCtor(): Ctor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Live dictation via the browser's speech recognizer (Chrome, Edge, Safari). */
export function useSpeech(onFinal: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<SpeechRecognitionLike | null>(null);
  const finalCb = useRef(onFinal);

  useEffect(() => {
    finalCb.current = onFinal;
  }, [onFinal]);

  useEffect(() => {
    // Feature detection must run after hydration to keep SSR markup stable.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(getCtor() !== null);
  }, []);

  const start = useCallback(() => {
    const C = getCtor();
    if (!C) return;
    const r = new C();
    r.continuous = true;
    r.interimResults = true;
    r.lang = navigator.language || "en-US";
    r.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalCb.current(res[0].transcript.trim());
        else live += res[0].transcript;
      }
      setInterim(live);
    };
    r.onerror = (e) => {
      setError(e.error === "not-allowed" ? "Microphone access was blocked. Allow it in your browser settings, or type instead." : `Speech error: ${e.error}`);
    };
    r.onend = () => {
      setListening(false);
      setInterim("");
    };
    rec.current = r;
    setError(null);
    r.start();
    setListening(true);
  }, []);

  const stop = useCallback(() => {
    rec.current?.stop();
  }, []);

  useEffect(() => () => rec.current?.stop(), []);

  return { supported, listening, interim, error, start, stop };
}
