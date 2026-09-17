import { createFileRoute } from "@tanstack/react-router";
import { KnurlMark } from "@/components/brand/mark";
import { Panel } from "@/components/ui/drawer";
import { academy, halls, iron, manifesto } from "@/lib/brand/copy";

export const Route = createFileRoute("/_app/ecosystem")({
  component: EcosystemPage,
});

function EcosystemPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="knurl-field -mx-4 rounded-xl border border-hairline px-5 py-8 md:-mx-0">
        <KnurlMark size={56} />
        <p className="mt-5 text-[11px] uppercase tracking-[0.32em] text-steel">Institution</p>
        <h1 className="font-display text-6xl tracking-[0.1em]">KNURL</h1>
        <p className="mt-2 text-sm text-steel">Iron · Halls · Academy · OS</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-3xl tracking-[0.12em]">{manifesto.title.toUpperCase()}</h2>
        {manifesto.body.map((p) => (
          <p key={p.slice(0, 24)} className="max-w-prose text-sm leading-relaxed text-chalk/90">
            {p}
          </p>
        ))}
      </section>

      <Panel>
        <h2 className="font-display text-3xl tracking-[0.12em]">{iron.title.toUpperCase()}</h2>
        <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-oxide">Tolerance</p>
        <p className="mt-1 text-sm leading-relaxed text-steel">{iron.tolerance}</p>
        <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-oxide">Marks</p>
        <p className="mt-1 text-sm leading-relaxed text-steel">{iron.marks}</p>
        <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-oxide">Plates</p>
        <p className="mt-1 text-sm leading-relaxed text-steel">{iron.plates}</p>
      </Panel>

      <section>
        <h2 className="font-display text-3xl tracking-[0.12em]">{halls.title.toUpperCase()}</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {halls.principles.map((p) => (
            <li key={p.slice(0, 20)} className="border-l-2 border-oxide pl-4 text-sm leading-relaxed text-steel">
              {p}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-3xl tracking-[0.12em]">{academy.title.toUpperCase()}</h2>
        <ol className="mt-3 flex flex-col gap-3">
          {academy.framework.map((p, i) => (
            <li key={p.slice(0, 20)} className="flex gap-3 text-sm leading-relaxed text-steel">
              <span className="font-display text-xl text-chalk">{String(i + 1).padStart(2, "0")}</span>
              {p}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
