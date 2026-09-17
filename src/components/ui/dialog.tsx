import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  title,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { title: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-mill/80 data-[state=open]:animate-in" />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-[min(32rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-hairline bg-graphite p-4 shadow-[var(--shadow-border)]",
          "max-h-[min(36rem,calc(100dvh-2rem))] overflow-y-auto",
          className,
        )}
        {...props}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <DialogPrimitive.Title className="font-display text-2xl tracking-[0.12em]">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close className="grid size-11 place-items-center rounded-md hover:bg-elevated">
            <X className="size-4" />
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
