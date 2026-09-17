import { cn } from "@/lib/utils";
import type { AppIcon } from "@/lib/domain/schema";

type Props = {
  size?: number;
  variant?: AppIcon;
  className?: string;
};

export function KnurlMark({ size = 32, variant = "mark", className }: Props) {
  const field = variant === "solid" ? "#E8E2D4" : variant === "oxide" ? "#C45C32" : "#0E0E0C";
  const glyph = variant === "solid" ? "#0E0E0C" : "#E8E2D4";
  const inner = variant === "solid" ? "#E8E2D4" : variant === "oxide" ? "#C45C32" : "#0E0E0C";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <rect width="32" height="32" fill={field} />
      <path fill={glyph} d="M16 3 L29 16 L16 29 L3 16 Z" />
      <path fill={inner} d="M16 10 L22 16 L16 22 L10 16 Z" />
    </svg>
  );
}

export function KnurlWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className="font-display text-[1.65rem] leading-none tracking-[0.14em]">KNURL</span>
      <span className="text-[10px] uppercase tracking-[0.36em] text-steel">OS</span>
    </div>
  );
}
