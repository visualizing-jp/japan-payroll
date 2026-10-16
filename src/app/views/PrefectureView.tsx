import { use, useMemo, useState } from "react";
import { PREF_NOTES } from "../data/annotations.ts";
import { loadPrefecture } from "../data/chunks.ts";
import { TypeList } from "../components/TypeList.tsx";
import { Segmented } from "../components/Segmented.tsx";
import { TrendStack, type Panel } from "../components/TrendStack.tsx";
import { useWidth } from "../hooks/useWidth.ts";
import { useUrlState } from "../hooks/useUrlState.ts";
import { format, kindOf, tick, timeNumber, unit } from "./SeriesView.tsx";

export function PrefectureView() {
  const pack = use(loadPrefecture());
  const defaultMetric = pack.metrics[0]!.code;
  const [metric, setMetric] = useUrlState("metric", defaultMetric, (v) =>
    pack.metrics.some((m) => m.code === v),
  );
  const [pref, setPref] = useUrlState<string>("pref", "13", (v) =>
    pack.prefs.some((p) => p.code === v),
  );
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const [ref, width] = useWidth<HTMLDivElement>();

  const cube = pack.year;
  const times = cube.codes("time");
  const axis = times.map(timeNumber);
  const current = pack.metrics.find((m) => m.code === metric)!;
  const place = pack.prefs.find((p) => p.code === pref)!;
  const kind = kindOf(metric);

  const rows = useMemo(
    () =>
      pack.prefs.map((p) => ({
        type: p,
        values: cube.series("value", "time", { pref: p.code, metric }),
      })),
    [pack.prefs, cube, metric],
  );

  const panels = useMemo((): Panel[] => {
    const values = cube.series("value", "time", { pref, metric });
    return [
      {
        key: metric,
        title: current.label,
        unit: unit(kind),
        format: (v) => format(kind, v),
        formatTick: (v) => tick(kind, v),
        series: [
          {
            key: metric,
            label: "",
            emphasized: true,
            points: times.map((_, i) => ({ year: axis[i]!, value: values[i] ?? null })),
          },
        ],
      },
    ];
  }, [axis, cube, current.label, kind, metric, pref, times]);

  const domain: [number, number] = [axis[0]!, axis.at(-1)!];
  const latest = axis.at(-1)!;

  return (
    <div className="mx-auto flex w-full max-w-[1240px] gap-8 px-6 py-6 max-lg:flex-col-reverse">
      <aside className="w-[288px] shrink-0 max-lg:w-full">
        <h2 className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-faint">都道府県</h2>
        <div className="max-h-[70vh] overflow-y-auto lg:max-h-[calc(100dvh-8rem)]">
          <TypeList rows={rows} years={axis} selected={pref} onSelect={setPref} />
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex flex-wrap items-baseline justify-between gap-3 pb-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-[19px] font-semibold tracking-tight">
              {place.label} · {current.label}
            </h1>
            <p className={`tnum text-[13px] ${hoverYear === null ? "text-faint" : "text-ink"}`}>
              {hoverYear ?? latest}年
            </p>
          </div>
          <Segmented
            options={pack.metrics.map((m) => ({ value: m.code, label: m.label }))}
            value={metric}
            onChange={setMetric}
            label="指標"
          />
        </header>

        <div ref={ref} className="min-h-[420px]">
          {width > 0 && (
            <TrendStack
              panels={panels}
              domain={domain}
              width={width}
              grain="year"
              hoverYear={hoverYear}
              onHoverYear={setHoverYear}
            />
          )}
        </div>

        <section className="mt-6 border-t border-rule pt-4">
          <h2 className="text-[11px] font-semibold tracking-wide text-faint">注記</h2>
          <dl className="mt-2 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {PREF_NOTES.map((n) => (
              <div key={n.term}>
                <dt className="tnum text-[12px] font-semibold">{n.term}</dt>
                <dd className="text-[11.5px] leading-relaxed text-muted">{n.detail}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </div>
  );
}
