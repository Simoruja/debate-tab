"use client";

import { useRef, type ComponentProps } from "react";
import { cn } from "cn";

/**
 * Pointer-tracked 3D tilt with a moving specular glare. Pure CSS transforms
 * (no WebGL), so it's cheap enough to use on every card in a grid. Disabled
 * for touch input and when the user prefers reduced motion.
 */
export function TiltCard({
  className,
  children,
  max = 8,
  ...props
}: ComponentProps<"div"> & { max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const reset = () => {
    cancelAnimationFrame(frame.current);
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--glare", "0");
  };

  return (
    <div className="group/tilt h-full [perspective:900px]">
      <div
        ref={ref}
        className={cn(
          "relative [transform-style:preserve-3d] transition-transform duration-300 ease-out will-change-transform motion-reduce:!transform-none",
          "[transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]",
          className,
        )}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const el = ref.current;
          if (!el) return;
          const { clientX, clientY } = e;
          cancelAnimationFrame(frame.current);
          frame.current = requestAnimationFrame(() => {
            const r = el.getBoundingClientRect();
            const px = (clientX - r.left) / r.width;
            const py = (clientY - r.top) / r.height;
            el.style.setProperty("--rx", `${(0.5 - py) * max}deg`);
            el.style.setProperty("--ry", `${(px - 0.5) * max}deg`);
            el.style.setProperty("--gx", `${px * 100}%`);
            el.style.setProperty("--gy", `${py * 100}%`);
            el.style.setProperty("--glare", "1");
          });
        }}
        onPointerLeave={reset}
        {...props}
      >
        {children}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-[var(--glare,0)] transition-opacity duration-300 motion-reduce:hidden"
          style={{
            background:
              "radial-gradient(40% 60% at var(--gx,50%) var(--gy,50%), rgba(255,255,255,0.35), transparent 70%)",
            mixBlendMode: "soft-light",
          }}
        />
      </div>
    </div>
  );
}
