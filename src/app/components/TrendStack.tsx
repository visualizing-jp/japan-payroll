/**
 * x 軸を共有した折れ線の積み重ね。
 */

import { useRef, useState, type PointerEvent } from "react";
import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";
import { MARKS } from "../data/annotations.ts";

export interface Point {
  year: number;
  value: number | null;
}

export interface Series {
  key: string;
  label: string;
  points: Point[];
  emphasized: boolean;
}

export interface Panel {
  key: string;
  title: string;
  unit: string;
  series: Series[];
  format: (value: number) => string;
  formatTick?: (value: number) => string;
  coverage?: string;
}

const M = { left: 62, right: 34, top: 0, bottom: 26 };
const HEADER_H = 24;
const PLOT_H = 132;
const GAP = 18;

export function formatTime(t: number, grain: "year" | "month"): string {
  if (grain === "year") return `${Math.round(t)}`;
  const y = Math.floor(t + 1e-9);
  const month = Math.round((t - y) * 12) + 1;
  return `${y}.${String(month).padStart(2, "0")}`;
}

function snapTime(raw: number, grain: "year" | "month", domain: [number, number]): number {
  const v = grain === "year" ? Math.round(raw) : Math.round(raw * 12) / 12;
  return Math.min(domain[1], Math.max(domain[0], v));
}

function xTicks(domain: [number, number]): number[] {
  const from = Math.floor(domain[0]);
  const to = Math.floor(domain[1]);
  const span = to - from;
  const step = span <= 20 ? 5 : span <= 50 ? 10 : 20;
  const start = Math.ceil(from / step) * step;
  const ticks: number[] = [];
  for (let t = start; t <= to; t += step) ticks.push(t);
  if (ticks[0] !== from) ticks.unshift(from);
  if (ticks.at(-1) !== to) ticks.push(to);
  return ticks;
}

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (value <= step * mag) return step * mag;
  }
  return 10 * mag;
}

function seriesPathD(
  points: Point[],
  x: (year: number) => number,
  y: (value: number) => number,
): string | undefined {
  const observed = points.filter((p): p is { year: number; value: number } => p.value !== null);
  if (observed.length < 2) return undefined;
  return (
    line<{ year: number; value: number }>()
      .x((p) => x(p.year))
      .y((p) => y(p.value))(observed) ?? undefined
  );
}

export function TrendStack({
  panels,
  domain,
  width,
  grain,
  hoverYear,
  onHoverYear,
}: {
  panels: Panel[];
  domain: [number, number];
  width: number;
  grain: "year" | "month";
  hoverYear: number | null;
  onHoverYear: (year: number | null) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [openMark, setOpenMark] = useState<number | null>(null);

  const height = panels.length * (HEADER_H + PLOT_H) + (panels.length - 1) * GAP + M.bottom;
  const x = scaleLinear().domain(domain).range([M.left, width - M.right]);

  function onMove(e: PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect === undefined) return;
    onHoverYear(snapTime(x.invert(e.clientX - rect.left), grain, domain));
  }

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="block touch-none select-none"
      onPointerMove={onMove}
      onPointerLeave={() => onHoverYear(null)}
    >
      {panels.map((panel, pi) => {
        const top = pi * (HEADER_H + PLOT_H + GAP);
        const plotTop = top + HEADER_H;
        const max = niceMax(
          Math.max(
            ...panel.series.flatMap((s) => s.points.map((p) => (p.value === null ? 0 : p.value))),
            0,
          ),
        );
        const y = scaleLinear().domain([0, max]).range([plotTop + PLOT_H, plotTop]);
        const pathD = (points: Point[]) => seriesPathD(points, (year) => x(year), (v) => y(v));

        const readout = panel.series.map((s) => {
            const p =
              hoverYear === null
                ? [...s.points].reverse().find((q) => q.value !== null)
                : s.points.find((q) => Math.abs(q.year - hoverYear) < 1e-6);
            return { key: s.key, label: s.label, point: p ?? null };
          });

        return (
          <g key={panel.key}>
            <text x={M.left} y={top + 13} className="fill-ink text-[13px] font-semibold">
              {panel.title}
              <tspan className="fill-faint font-normal"> {panel.unit}</tspan>
            </text>
            <text
              x={width - M.right}
              y={top + 13}
              textAnchor="end"
              className="tnum fill-ink text-[13px] font-semibold"
            >
              {readout.map((r, i) => (
                <tspan key={r.key} dx={i === 0 ? 0 : 14}>
                  {readout.length > 1 && (
                    <tspan className="fill-muted text-[11px] font-normal">{r.label} </tspan>
                  )}
                  {r.point?.value == null ? "—" : panel.format(r.point.value)}
                </tspan>
              ))}
            </text>

            {[0, max / 2, max].map((v) => (
              <g key={v}>
                <line
                  x1={M.left}
                  x2={width - M.right}
                  y1={y(v)}
                  y2={y(v)}
                  className="stroke-rule"
                  strokeWidth={1}
                />
                <text
                  x={M.left - 8}
                  y={y(v) + 4}
                  textAnchor="end"
                  className="tnum fill-faint text-[10px]"
                >
                  {v === 0 ? "0" : (panel.formatTick ?? panel.format)(v)}
                </text>
              </g>
            ))}

            {MARKS.filter((m) => m.year >= domain[0] && m.year <= domain[1]).map((m) => (
              <line
                key={m.year}
                x1={x(m.year)}
                x2={x(m.year)}
                y1={plotTop}
                y2={plotTop + PLOT_H}
                className="stroke-rule-strong"
                strokeWidth={1}
                strokeDasharray="2 3"
              />
            ))}

            {panel.series.map((s) => (
              <g key={s.key} className={s.emphasized ? "" : "opacity-45"}>
                <path
                  d={pathD(s.points)}
                  fill="none"
                  className={s.emphasized ? "stroke-accent" : "stroke-muted"}
                  strokeWidth={s.emphasized ? 1.75 : 1}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {panel.series.length > 1 &&
                  (() => {
                    const last = [...s.points].reverse().find((p) => p.value !== null);
                    if (last === undefined) return null;
                    return (
                      <text
                        x={x(last.year) + 5}
                        y={y(last.value!) + 3.5}
                        className={`text-[10px] font-medium ${
                          s.emphasized ? "fill-accent" : "fill-muted"
                        }`}
                      >
                        {s.label}
                      </text>
                    );
                  })()}
              </g>
            ))}

            {hoverYear !== null && (
              <g className="pointer-events-none">
                <line
                  x1={x(hoverYear)}
                  x2={x(hoverYear)}
                  y1={plotTop}
                  y2={plotTop + PLOT_H}
                  className="stroke-ink/35"
                  strokeWidth={1}
                />
                {panel.series.map((s) => {
                  const p = s.points.find((q) => Math.abs(q.year - hoverYear) < 1e-6);
                  if (p?.value == null) return null;
                  return (
                    <circle
                      key={s.key}
                      cx={x(p.year)}
                      cy={y(p.value)}
                      r={3}
                      className={s.emphasized ? "fill-accent" : "fill-muted"}
                      stroke="var(--color-surface)"
                      strokeWidth={1.5}
                    />
                  );
                })}
              </g>
            )}

            {panel.coverage !== undefined && (
              <text x={M.left + 4} y={plotTop + 12} className="fill-faint text-[10px]">
                {panel.coverage}
              </text>
            )}
          </g>
        );
      })}

      <g transform={`translate(0, ${height - M.bottom})`}>
        <line x1={M.left} x2={width - M.right} className="stroke-rule-strong" strokeWidth={1} />
        {xTicks(domain).map((t) => (
          <text key={t} x={x(t)} y={16} textAnchor="middle" className="tnum fill-muted text-[10px]">
            {t}
          </text>
        ))}
        {hoverYear !== null && (
          <g className="pointer-events-none">
            <rect
              x={x(hoverYear) - (grain === "month" ? 28 : 20)}
              y={3}
              width={grain === "month" ? 56 : 40}
              height={17}
              rx={3}
              className="fill-ink"
            />
            <text
              x={x(hoverYear)}
              y={16}
              textAnchor="middle"
              className="tnum fill-paper text-[10px] font-medium"
            >
              {formatTime(hoverYear, grain)}
            </text>
          </g>
        )}
      </g>

      <g>
        {MARKS.filter((m) => m.year >= domain[0] && m.year <= domain[1]).map((m) => (
          <g
            key={m.year}
            className="cursor-help"
            onPointerEnter={() => setOpenMark(m.year)}
            onPointerLeave={() => setOpenMark(null)}
          >
            <rect x={x(m.year) - 5} y={HEADER_H - 4} width={10} height={PLOT_H} fill="transparent" />
            <text
              x={x(m.year)}
              y={HEADER_H + 12}
              textAnchor="middle"
              className={
                openMark === m.year
                  ? "fill-ink text-[10px] font-semibold"
                  : "fill-muted text-[10px] font-semibold"
              }
            >
              {m.year}
            </text>
          </g>
        ))}
      </g>

      {openMark !== null && (
        <MarkTooltip year={openMark} x={x(openMark)} width={width} y={HEADER_H + 18} />
      )}
    </svg>
  );
}

function MarkTooltip({
  year,
  x,
  y,
  width,
}: {
  year: number;
  x: number;
  y: number;
  width: number;
}) {
  const mark = MARKS.find((m) => m.year === year)!;
  const w = 260;
  const left = Math.min(Math.max(x - w / 2, 8), width - w - 8);
  return (
    <foreignObject x={left} y={y} width={w} height={140} className="pointer-events-none">
      <div className="rounded-md border border-rule bg-surface px-3 py-2 shadow-[0_6px_20px_-8px_rgba(22,20,15,0.3)]">
        <p className="text-[11px] font-semibold text-ink">
          {mark.year}年 · {mark.label}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">{mark.detail}</p>
      </div>
    </foreignObject>
  );
}
