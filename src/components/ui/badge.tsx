import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "steel",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "steel" | "oxide" | "chalk" | "live" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em]",
        tone === "steel" && "bg-elevated text-steel",
        tone === "oxide" && "bg-oxide/15 text-oxide",
        tone === "chalk" && "bg-chalk text-mill",
        tone === "live" && "bg-oxide text-chalk",
        className,
      )}
      {...props}
    />
  );
}
