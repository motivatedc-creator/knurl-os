import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Building2,
  Database,
  Download,
  Library,
  ListChecks,
  Palette,
  Weight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/drawer";
import { usePrefs } from "@/lib/store/prefs";
import type { AppIcon, OneRmFormula, ThemeName, UnitSystem } from "@/lib/domain/schema";
import { KnurlMark } from "@/components/brand/mark";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/system")({
  component: SystemPage,
});

const LINKS = [
  { to: "/routines", label: "Routines", copy: "Build and reorder templates", icon: ListChecks },
  { to: "/exercises", label: "Catalog", copy: "Starter library and custom movements", icon: Library },
  { to: "/biometrics", label: "Biometrics", copy: "Bodyweight and circumferences", icon: Activity },
  { to: "/hardware", label: "Iron", copy: "Bars, plates, collars", icon: Weight },
  { to: "/vault", label: "Vault", copy: "JSON export and restore", icon: Database },
  { to: "/import", label: "Import", copy: "Strong CSV with preview", icon: Download },
  { to: "/ecosystem", label: "Institution", copy: "Manifesto, Iron, Halls, Academy", icon: Building2 },
] as const;

function SystemPage() {
  const prefs = usePrefs();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.32em] text-steel">System</p>
        <h1 className="font-display text-5xl tracking-[0.08em]">PREFS</h1>
      </header>

      <Panel className="flex flex-col gap-4">
        <Row label="Units">
          {(["kg", "lb"] as UnitSystem[]).map((u) => (
            <Chip key={u} on={prefs.units === u} onClick={() => prefs.update({ units: u })}>
              {u}
            </Chip>
          ))}
        </Row>
        <Row label="Theme">
          {(["mill", "chalk"] as ThemeName[]).map((t) => (
            <Chip key={t} on={prefs.theme === t} onClick={() => prefs.update({ theme: t })}>
              {t}
            </Chip>
          ))}
        </Row>
        <Row label="1RM">
          {(["epley", "brzycki"] as OneRmFormula[]).map((f) => (
            <Chip key={f} on={prefs.oneRmFormula === f} onClick={() => prefs.update({ oneRmFormula: f })}>
              {f}
            </Chip>
          ))}
        </Row>
        <Row label="Secondary volume">
          {[0.5, 0.25, 0].map((n) => (
            <Chip
              key={n}
              on={prefs.secondaryVolumeFactor === n}
              onClick={() => prefs.update({ secondaryVolumeFactor: n })}
            >
              {n}
            </Chip>
          ))}
        </Row>
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-steel">App mark</p>
          <div className="flex gap-3">
            {(["mark", "solid", "oxide"] as AppIcon[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => prefs.update({ appIcon: v })}
                className={cn(
                  "rounded-md border p-2",
                  prefs.appIcon === v ? "border-oxide" : "border-hairline",
                )}
                aria-label={v}
              >
                <KnurlMark size={40} variant={v} />
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <ul className="flex flex-col gap-2">
        {LINKS.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="block">
              <Panel className="flex items-center gap-3 p-4 hover:border-hairline-strong">
                <item.icon className="size-5 text-steel" strokeWidth={1.6} />
                <span>
                  <span className="block font-medium">{item.label}</span>
                  <span className="text-[11px] text-steel">{item.copy}</span>
                </span>
              </Panel>
            </Link>
          </li>
        ))}
      </ul>
      <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-steel">
        <Palette className="size-3.5" /> Mill-scale field · chalk type · oxide only when live
      </p>
      <Button variant="outline" asChild>
        <a href="?install=1&platform=ios">Install on this device</a>
      </Button>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-steel">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-10 rounded-md px-3 text-xs uppercase tracking-[0.14em]",
        on ? "bg-chalk text-mill" : "bg-elevated text-steel",
      )}
    >
      {children}
    </button>
  );
}
