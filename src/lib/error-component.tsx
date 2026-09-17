import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

const FALLBACK_MESSAGE = "Something went wrong. Reload the page and try again.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-mill px-6 text-center text-chalk">
      <TriangleAlert className="size-10 text-oxide" strokeWidth={1.75} aria-hidden="true" />
      <h1 className="font-display text-3xl tracking-tight">Something broke</h1>
      <p className="max-w-md text-sm break-words text-steel">{errorMessage(error)}</p>
    </main>
  );
}
