import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-md border border-hairline bg-inset px-3 text-base text-chalk tabular-nums placeholder:text-steel/70",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxide",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
