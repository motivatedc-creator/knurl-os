import { Drawer as Vaul } from "vaul";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Drawer({
  open,
  onOpenChange,
  children,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  title: string;
}) {
  return (
    <Vaul.Root open={open} onOpenChange={onOpenChange}>
      <Vaul.Portal>
        <Vaul.Overlay className="fixed inset-0 z-50 bg-mill/70" />
        <Vaul.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-xl border border-hairline bg-graphite">
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-hairline-strong" />
          <Vaul.Title className="px-4 pt-4 font-display text-2xl tracking-[0.12em]">
            {title}
          </Vaul.Title>
          <div className="overflow-y-auto px-4 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            {children}
          </div>
        </Vaul.Content>
      </Vaul.Portal>
    </Vaul.Root>
  );
}

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-hairline bg-graphite p-4", className)}
      {...props}
    />
  );
}
