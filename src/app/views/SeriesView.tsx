import { useMemo, useState } from "react";
import { MARKS, NOTES } from "../data/annotations.ts";
import type { Form, Grain, Pack, Sex } from "../data/chunks.ts";
import { TypeList } from "../components/TypeList.tsx";
import { Segmented } from "../components/Segmented.tsx";
import { TrendStack, formatTime, type Panel, type Point, type Series } from "../components/TrendStack.tsx";
import { useWidth } from "../hooks/useWidth.ts";
import { useUrlState } from "../hooks/useUrlState.ts";

const FORMS = [
  { value: "0", label: "計" },
  { value: "1", label: "一般" },
  { value: "2", label: "パート" },
] as const;

const SEXES = [
  { value: "0", label: "計" },
  { value: "1", label: "男" },
  { value: "2", label: "女" },
] as const;

const GRAINS = [
  { value: "year", label: "年次" },
  { value: "month", label: "月次" },
] as const;

const yen = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const one = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 1, minimumFractionDigits: 0 });
const pct = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

export type Kind = "yen" | "index" | "hours" | "days" | "people" | "rate";

export function kindOf(metric: string): Kind {
  if (metric === "real_cash" || metric === "real_contractual" || metric === "emp_index") return "index";
  if (metric === "total" || metric === "scheduled" || metric === "overtime" || metric === "hours") {
    return "hours";
  }
  if (metric === "days") return "days";
  if (metric === "workers" || metric === "part_workers") return "people";
  if (metric === "part_share" || metric === "hire" || metric === "leave") return "rate";
  return "yen";
}

export function format(kind: Kind, value: number): string {
  if (kind === "yen") return `${yen.format(value / 10000)}万円`;
  if (kind === "index") return one.format(value);
  if (kind === "hours") return `${one.format(value)}時間`;
  if (kind === "days") return `${one.format(value)}日`;
  if (kind === "people") return `${yen.format(value / 10000)}万人`;
  return `${pct.format(value * 100)}%`;
}

export function tick(kind: Kind, value: number): string {
  if (kind === "yen") return yen.format(value / 10000);
  if (kind === "people") return yen.format(value / 10000);
  if (kind === "rate") return `${pct.format(value * 100)}%`;
  return one.format(value);
}

export function unit(kind: Kind): string {
  if (kind === "yen") return "万円";
  if (kind === "index") return "2020年=100";
  if (kind === "hours") return "時間";
  if (kind === "days") return "日";
  if (kind === "people") return "万人";
  return "%";
}

export function timeNumber(code: string): number {
  if (code.includes("-")) {
    const [y, m] = code.split("-");
    return Number(y) + (Number(m) - 1) / 12;
  }
  return Number(code);
}

function isFlowRate(metric: string): boolean {
  return metric === "hire" || metric === "leave";
}

export function movingAverage(points: Point[], window: number): Point[] {
  return points.map((p, i) => {
    if (i < window - 1) return { year: p.year, value: null };
    let sum = 0;
    for (let j = i - window + 1; j <= i; j++) {
      const v = points[j]!.value;
      if (v === null) return { year: p.year, value: null };
      sum += v;
    }
    return { year: p.year, value: sum / window };
  });
}

export function flowRateSeries(key: string, points: Point[], grain: Grain): Series[] {
  if (grain !== "month") {
    return [{ key, label: "", points, emphasized: true }];
  }
  return [
    { key, label: "月次", points, emphasized: false },
    { key: `${key}-ma12`, label: "12か月平均", points: movingAverage(points, 12), emphasized: true },
  ];
}

export function SeriesView({
  pack,
  extra,
}: {
  pack: Pack;
  extra?: (metric: string, form: string, grain: Grain, sex: Sex) => Panel[];
}) {
  const defaultMetric = pack.metrics[0]!.code;
  const [metric, setMetric] = useUrlState("metric", defaultMetric, (v) =>
    pack.metrics.some((m) => m.code === v),
  );
  const [form, setForm] = useUrlState<Form>("form", "0", (v) =>
    FORMS.some((f) => f.value === v),
  );
  const [sex, setSex] = useUrlState<Sex>("sex", "0", (v) => SEXES.some((s) => s.value === v));
  const [grain, setGrain] = useUrlState<Grain>("grain", "year", (v) => v === "year" || v === "month");
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const [ref, width] = useWidth<HTMLDivElement>();

  const pickForm = (next: Form) => {
    if (next !== "0") setSex("0");
    setForm(next);
  };
  const pickSex = (next: Sex) => {
    if (next !== "0") {
      setForm("0");
      setGrain("year");
    }
    setSex(next);
  };
  const pickGrain = (next: Grain) => {
    if (next === "month") setSex("0");
    setGrain(next);
  };

  const cube = grain === "year" ? pack.year : pack.month;
  const times = cube.codes("time");
  const axis = times.map(timeNumber);
  const current = pack.metrics.find((m) => m.code === metric)!;
  const kind = kindOf(metric);

  const rows = useMemo(
    () =>
      pack.metrics.map((m) => ({
        type: m,
        values: cube.series("value", "time", { form, sex, metric: m.code }),
      })),
    [pack.metrics, cube, form, sex],
  );

  const panels = useMemo((): Panel[] => {
    const values = cube.series("value", "time", { form, sex, metric });
    const points: Point[] = times.map((_, i) => ({
      year: axis[i]!,
      value: values[i] ?? null,
    }));
    const main: Panel = {
      key: metric,
      title: current.label,
      unit: unit(kind),
      format: (v) => format(kind, v),
      formatTick: (v) => tick(kind, v),
      series: isFlowRate(metric)
        ? flowRateSeries(metric, points, grain)
        : [{ key: metric, label: "", points, emphasized: true }],
    };
    return [main, ...(extra?.(metric, form, grain, sex) ?? [])];
  }, [axis, cube, current.label, extra, form, grain, kind, metric, sex, times]);

  const domain: [number, number] = [axis[0]!, axis.at(-1)!];
  const latest = axis.at(-1)!;

  return (
    <div className="mx-auto flex w-full max-w-[1240px] gap-8 px-6 py-6 max-lg:flex-col-reverse">
      <aside className="w-[288px] shrink-0 max-lg:w-full">
        <h2 className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-faint">指標</h2>
        <div className="max-h-[70vh] overflow-y-auto lg:max-h-[calc(100dvh-8rem)]">
          <TypeList rows={rows} years={axis} selected={metric} onSelect={setMetric} />
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex flex-wrap items-baseline justify-between gap-3 pb-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-[19px] font-semibold tracking-tight">{current.label}</h1>
            <p className={`tnum text-[13px] ${hoverYear === null ? "text-faint" : "text-ink"}`}>
              {formatTime(hoverYear ?? latest, grain)}
              {grain === "year" ? "年" : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Segmented options={GRAINS} value={grain} onChange={pickGrain} label="周期" />
            <Segmented options={FORMS} value={form} onChange={pickForm} label="就業形態" />
            <Segmented options={SEXES} value={sex} onChange={pickSex} label="性別" />
          </div>
        </header>

        <div ref={ref} className="min-h-[420px]">
          {width > 0 && (
            <TrendStack
              panels={panels}
              domain={domain}
              width={width}
              grain={grain}
              hoverYear={hoverYear}
              onHoverYear={setHoverYear}
            />
          )}
        </div>

        <section className="mt-6 border-t border-rule pt-4">
          <h2 className="text-[11px] font-semibold tracking-wide text-faint">注記</h2>
          <dl className="mt-2 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {[
              ...MARKS.map((m) => ({
                key: String(m.year),
                term: `${m.year}年 · ${m.label}`,
                detail: m.detail,
              })),
              ...NOTES.map((n) => ({ key: n.term, term: n.term, detail: n.detail })),
            ].map((n) => (
              <div key={n.key}>
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
