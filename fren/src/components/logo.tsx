export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
        <circle cx="9" cy="10" r="5" fill="#ff6b3d" />
        <circle cx="20" cy="9" r="3.5" fill="#7c66f0" />
        <circle cx="17" cy="20" r="4.5" fill="#2fb57a" />
        <path d="M9 10 L20 9 L17 20 Z" fill="none" stroke="#1d1a16" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
      <span className="font-display text-xl font-bold tracking-tight">fren</span>
    </span>
  );
}
