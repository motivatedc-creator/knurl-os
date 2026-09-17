import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/ui/drawer";
import { brand } from "@/lib/brand/tokens";
import { formatLoad } from "@/lib/format";
import { useMounted, useVaultQuery } from "@/lib/hooks";
import { usePrefs } from "@/lib/store/prefs";
import { loadAnalytics, type AnalyticsRange } from "@/lib/storage/stats";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/analytics")({
  component: AnalyticsPage,
});

const RANGES: AnalyticsRange[] = ["1M", "3M", "6M", "1Y", "ALL"];
const LINE = [brand.chalk, brand.oxide, brand.steel, brand.verdigris];

function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>("3M");
  const formula = usePrefs((s) => s.oneRmFormula);
  const factor = usePrefs((s) => s.secondaryVolumeFactor);
  const units = usePrefs((s) => s.units);
  const mounted = useMounted();
  const data = useVaultQuery(() => loadAnalytics(range, formula, factor), [range, formula, factor]);

  const merged: Record<string, Record<string, number | string>> = {};
  for (const series of data?.e1rm ?? []) {
    for (const p of series.points) {
      merged[p.date] = { ...(merged[p.date] ?? { date: p.date }), [series.name]: p.value };
    }
  }
  const lineData = Object.values(merged).sort((a, b) => String(a.date).localeCompare(String(b.date)));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Analytics"
        subtitle={`Estimated 1RM uses ${formula === "epley" ? "Epley" : "Brzycki"}. Warm-up sets are left out.`}
      />
      <div className="flex flex-wrap gap-2" data-testid="range-filters">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={cn(
              "h-10 rounded-md px-3 text-xs uppercase tracking-[0.16em]",
              range === r ? "bg-chalk text-mill" : "bg-elevated text-steel",
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <Panel>
        <h2 className="mb-3 text-[11px] uppercase tracking-[0.2em] text-steel">Estimated 1RM</h2>
        <div className="h-56">
          {mounted && lineData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid stroke={brand.hairline} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: brand.steel, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: brand.steel, fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip
                  contentStyle={{
                    background: brand.graphite,
                    border: `1px solid ${brand.hairline}`,
                    color: brand.chalk,
                    fontSize: 12,
                  }}
                />
                {(data?.e1rm ?? []).map((s, i) => (
                  <Line
                    key={s.name}
                    type="monotone"
                    dataKey={s.name}
                    stroke={LINE[i % LINE.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
        <table className="mt-4 w-full text-left text-sm">
          <caption className="sr-only">Estimated 1RM tabular fallback</caption>
          <thead className="text-[10px] uppercase tracking-[0.16em] text-steel">
            <tr>
              <th className="py-2">Lift</th>
              <th>Last</th>
            </tr>
          </thead>
          <tbody>
            {(data?.e1rm ?? []).map((s) => (
              <tr key={s.name} className="border-t border-hairline">
                <td className="py-2">{s.name}</td>
                <td className="tabular-nums">
                  {s.points.length ? formatLoad(s.points.at(-1)!.value, units) : "—"} {units}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel>
        <h2 className="mb-3 text-sm font-medium">Volume by muscle</h2>
        <div className="h-56">
          {mounted && data?.buckets.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.buckets} layout="vertical" margin={{ left: 64 }}>
                <XAxis type="number" tick={{ fill: brand.steel, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="muscle"
                  tick={{ fill: brand.steel, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={64}
                />
                <Tooltip
                  contentStyle={{
                    background: brand.graphite,
                    border: `1px solid ${brand.hairline}`,
                    color: brand.chalk,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="kg" fill={brand.chalk} radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
        <table className="mt-4 w-full text-left text-sm" data-testid="tonnage-table">
          <thead className="text-[10px] uppercase tracking-[0.16em] text-steel">
            <tr>
              <th className="py-2">Bucket</th>
              <th>kg stored</th>
            </tr>
          </thead>
          <tbody>
            {(data?.buckets ?? []).map((b) => (
              <tr key={b.muscle} className="border-t border-hairline">
                <td className="py-2">{b.muscle}</td>
                <td className="tabular-nums">{Math.round(b.kg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel>
        <h2 className="mb-3 text-[11px] uppercase tracking-[0.2em] text-steel">Rep-max brackets</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead className="text-[10px] uppercase tracking-[0.16em] text-steel">
              <tr>
                <th className="py-2">Lift</th>
                <th>1</th>
                <th>3</th>
                <th>5</th>
                <th>8</th>
                <th>10</th>
              </tr>
            </thead>
            <tbody>
              {(data?.repMax ?? []).map((r) => (
                <tr key={r.name} className="border-t border-hairline">
                  <td className="py-2">{r.name}</td>
                  {[r.r1, r.r3, r.r5, r.r8, r.r10].map((v, i) => (
                    <td key={i} className="tabular-nums">
                      {v == null ? "—" : formatLoad(v, units)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="grid h-full place-items-center rounded-md bg-elevated text-sm text-steel">
      No closed sessions in this window.
    </div>
  );
}
