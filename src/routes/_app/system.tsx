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
  Wrench,
  Weight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
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
  { to: "/tools", label: "Plate calculator", copy: "Load a bar and build a warm-up", icon: Wrench },
  { to: "/routines", label: "Templates", copy: "Build, copy, and start workouts", icon: ListChecks },
  { to: "/exercises", label: "Exercises", copy: "Library plus your custom lifts", icon: Library },
  { to: "/biometrics", label: "Measurements", copy: "Bodyweight and girths", icon: Activity },
  { to: "/hardware", label: "Equipment", copy: "Bars, plates, and collars you own", icon: Weight },
  { to: "/vault", label: "Backup", copy: "Export, merge, or restore this device", icon: Database },
  { to: "/import", label: "Import from Strong", copy: "Preview a CSV, then write it in", icon: Download },
  { to: "/ecosystem", label: "About Knurl", copy: "Iron, halls, and the academy", icon: Building2 },
] as const;

function SystemPage() {
  const prefs = usePrefs();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="More" subtitle="Settings, templates, backup, and the rest of the gym." />

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
        <Row label="Rest timer sound">
          <Chip on={prefs.restBeep} onClick={() => prefs.update({ restBeep: !prefs.restBeep })}>
            {prefs.restBeep ? "On" : "Off"}
          </Chip>
        </Row>
        <Row label="Rest timer vibrate">
          <Chip on={prefs.restVibrate} onClick={() => prefs.update({ restVibrate: !prefs.restVibrate })}>
            {prefs.restVibrate ? "On" : "Off"}
          </Chip>
        </Row>
        <div>
          <p className="mb-2 text-xs text-steel">App icon</p>
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
                  <span className="text-xs text-steel">{item.copy}</span>
                </span>
              </Panel>
            </Link>
          </li>
        ))}
      </ul>
      <p className="flex items-center gap-2 text-xs text-steel">
        <Palette className="size-3.5" /> Dark mill theme. Chalk type. Orange only when a workout is live.
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
      <p className="mb-2 text-xs text-steel">{label}</p>
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
