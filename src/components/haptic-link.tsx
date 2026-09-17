"use client";

import Link, { type LinkProps } from "next/link";
import { type ComponentProps } from "react";
import { cn } from "cn";
import { haptic } from "@/lib/haptics";

type HapticLinkProps = LinkProps &
  Omit<ComponentProps<"a">, keyof LinkProps> & {
    haptic?: keyof typeof haptic;
  };

export function HapticLink({
  className,
  onClick,
  haptic: kind = "tap",
  ...props
}: HapticLinkProps) {
  return (
    <Link
      className={cn("pressable", className)}
      onClick={(e) => {
        haptic[kind]();
        onClick?.(e);
      }}
      {...props}
    />
  );
}
