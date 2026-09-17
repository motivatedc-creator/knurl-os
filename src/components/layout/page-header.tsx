import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-4xl tracking-tight md:text-5xl">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-md text-sm text-steel">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}
