/**
 * 累積 CSV・年次原表・地方調査から配信用 cube を書く。
 * 対象は調査産業計 × 5人以上。年次と月次を分ける。
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Cube, round } from "../src/lib/transform/cube.ts";
import { GENSHYO, PREFS, PREF_FILES } from "./catalog.ts";
import { num, readSjisCsv } from "./csv.ts";
import { readGenshyo } from "./genshyo.ts";
import { readPrefTable } from "./pref.ts";

const RAW = resolve(import.meta.dirname, "../data/raw");
const OUT = resolve(import.meta.dirname, "../public/data");

const FORMS = ["0", "1", "2"] as const;
const SEXES = ["0", "1", "2"] as const;
const PREF_METRICS = ["cash", "hours", "workers"] as const;
const WAGE_METRICS = [
  "cash",
  "contractual",
  "scheduled",
  "overtime_pay",
  "special",
  "real_cash",
  "real_contractual",
] as const;
const HOUR_METRICS = ["total", "scheduled", "overtime", "days"] as const;
const JOB_METRICS = [
  "workers",
  "part_workers",
  "part_share",
  "hire",
  "leave",
  "emp_index",
] as const;

type Grain = "year" | "month";

interface Row {
  year: number;
  month: string;
  form: string;
  sex: string;
  time: string;
  grain: Grain;
  cash: number | null;
  contractual: number | null;
  scheduled: number | null;
  overtime_pay: number | null;
  special: number | null;
  hours_total: number | null;
  hours_scheduled: number | null;
  hours_overtime: number | null;
  days: number | null;
  workers: number | null;
  part_workers: number | null;
  real_cash: number | null;
  real_contractual: number | null;
  emp_index: number | null;
  part_share: number | null;
  hire: number | null;
  leave: number | null;
}

function cell(row: Record<string, string>, key: string): string {
  return row[key] ?? "";
}

function keep(row: Record<string, string>): boolean {
  return cell(row, "産業分類") === "TL" && cell(row, "規模") === "T" && FORMS.includes(cell(row, "就業形態") as (typeof FORMS)[number]);
}

function timeCode(year: number, month: string): { time: string; grain: Grain } | null {
  if (month === "CY") return { time: String(year), grain: "year" };
  if (/^(0[1-9]|1[0-2])$/.test(month)) return { time: `${year}-${month}`, grain: "month" };
  return null;
}

function merge(
  jissu: Record<string, string>[],
  sisu: Record<string, string>[],
): Row[] {
  const map = new Map<string, Row>();

  const put = (src: Record<string, string>, fill: (row: Row) => void) => {
    if (!keep(src)) return;
    const year = Number(cell(src, "年"));
    const clock = timeCode(year, cell(src, "月"));
    if (clock === null || !Number.isFinite(year)) return;
    const key = `${cell(src, "就業形態")}|0|${clock.grain}|${clock.time}`;
    let row = map.get(key);
    if (row === undefined) {
      row = {
        year,
        month: cell(src, "月"),
        form: cell(src, "就業形態"),
        sex: "0",
        time: clock.time,
        grain: clock.grain,
        cash: null,
        contractual: null,
        scheduled: null,
        overtime_pay: null,
        special: null,
        hours_total: null,
        hours_scheduled: null,
        hours_overtime: null,
        days: null,
        workers: null,
        part_workers: null,
        real_cash: null,
        real_contractual: null,
        emp_index: null,
        part_share: null,
        hire: null,
        leave: null,
      };
      map.set(key, row);
    }
    fill(row);
  };

  for (const src of jissu) {
    put(src, (row) => {
      row.cash = num(cell(src, "現金給与総額"));
      row.contractual = num(cell(src, "きまって支給する給与"));
      row.scheduled = num(cell(src, "所定内給与"));
      row.overtime_pay = num(cell(src, "所定外給与"));
      row.special = num(cell(src, "特別給与"));
      row.hours_total = num(cell(src, "総実労働時間"));
      row.hours_scheduled = num(cell(src, "所定内労働時間"));
      row.hours_overtime = num(cell(src, "所定外労働時間"));
      row.days = num(cell(src, "出勤日数"));
      row.workers = num(cell(src, "本月末労働者数"));
      row.part_workers = num(cell(src, "パートタイム労働者数"));
    });
  }

  for (const src of sisu) {
    if (cell(src, "種別") !== "指数") continue;
    put(src, (row) => {
      row.real_cash = num(cell(src, "実質賃金指数（現金給与総額）"));
      row.real_contractual = num(cell(src, "実質賃金指数（きまって支給する給与）"));
      row.emp_index = num(cell(src, "常用雇用"));
      const share = num(cell(src, "パートタイム労働者比率"));
      row.part_share = share === null ? null : round(share / 100, 4);
      const hire = num(cell(src, "入職率"));
      const leave = num(cell(src, "離職率"));
      row.hire = hire === null ? null : round(hire / 100, 4);
      row.leave = leave === null ? null : round(leave / 100, 4);
    });
  }

  return [...map.values()];
}

function addSex(rows: Row[], rawDir: string): void {
  for (const file of GENSHYO) {
    const path = resolve(rawDir, "genshyo", `${file.year}.xls`);
    if (!existsSync(path)) throw new Error(`無い: ${path}`);
    for (const src of readGenshyo(path, file.year)) {
      rows.push({
        year: src.year,
        month: "CY",
        form: "0",
        sex: src.sex,
        time: String(src.year),
        grain: "year",
        cash: src.cash,
        contractual: src.contractual,
        scheduled: null,
        overtime_pay: null,
        special: src.special,
        hours_total: src.hours_total,
        hours_scheduled: src.hours_scheduled,
        hours_overtime: src.hours_overtime,
        days: src.days,
        workers: src.workers,
        part_workers: src.part_workers,
        real_cash: null,
        real_contractual: null,
        emp_index: null,
        part_share:
          src.workers === null || src.part_workers === null || src.workers === 0
            ? null
            : round(src.part_workers / src.workers, 4),
        hire: null,
        leave: null,
      });
    }
  }
}

function times(rows: Row[], grain: Grain): string[] {
  return [...new Set(rows.filter((r) => r.grain === grain).map((r) => r.time))].sort();
}

function writeCube<M extends string>(
  rows: Row[],
  grain: Grain,
  metrics: readonly M[],
  pick: (row: Row, metric: M) => number | null,
): ReturnType<Cube["toJSON"]> {
  const time = times(rows, grain);
  const cube = new Cube(
    [
      { name: "form", codes: [...FORMS] },
      { name: "sex", codes: [...SEXES] },
      { name: "metric", codes: [...metrics] },
      { name: "time", codes: time },
    ],
    ["value"],
  );
  for (const row of rows) {
    if (row.grain !== grain) continue;
    for (const metric of metrics) {
      cube.set("value", [row.form, row.sex, metric, row.time], pick(row, metric));
    }
  }
  return cube.toJSON();
}

function writePrefCube(): ReturnType<Cube["toJSON"]> {
  const years = PREF_FILES.map((f) => String(f.year));
  const cube = new Cube(
    [
      { name: "pref", codes: PREFS.map((p) => p.code) },
      { name: "metric", codes: [...PREF_METRICS] },
      { name: "time", codes: years },
    ],
    ["value"],
  );
  for (const file of PREF_FILES) {
    const path = resolve(RAW, "pref", `${file.year}.xlsx`);
    if (!existsSync(path)) throw new Error(`無い: ${path}`);
    for (const row of readPrefTable(path, file.year)) {
      const time = String(row.year);
      cube.set("value", [row.pref, "cash", time], row.cash);
      cube.set("value", [row.pref, "hours", time], row.hours);
      cube.set("value", [row.pref, "workers", time], row.workers);
    }
  }
  return cube.toJSON();
}

function main(): void {
  const jissu = readSjisCsv(resolve(RAW, "hon-maikin-k-jissu.csv"));
  const sisu = readSjisCsv(resolve(RAW, "hon-maikin-k-sisu.csv"));
  const rows = merge(jissu, sisu);
  addSex(rows, RAW);
  if (rows.length === 0) throw new Error("採用行が無い");

  const years = times(rows, "year");
  const months = times(rows, "month");
  const latestYear = years.at(-1)!;
  const latestMonth = months.at(-1)!;

  mkdirSync(OUT, { recursive: true });

  const sexes = [
    { code: "0", label: "計", level: 0 },
    { code: "1", label: "男", level: 0 },
    { code: "2", label: "女", level: 0 },
  ];

  const wages = {
    year: writeCube(rows, "year", WAGE_METRICS, (r, m) => r[m]),
    month: writeCube(rows, "month", WAGE_METRICS, (r, m) => r[m]),
    metrics: [
      { code: "cash", label: "現金給与総額", level: 0 },
      { code: "real_cash", label: "実質賃金（現金給与総額）", level: 0 },
      { code: "contractual", label: "きまって支給する給与", level: 0 },
      { code: "scheduled", label: "所定内給与", level: 0 },
      { code: "overtime_pay", label: "所定外給与", level: 0 },
      { code: "special", label: "特別給与", level: 0 },
      { code: "real_contractual", label: "実質賃金（きまって支給する給与）", level: 0 },
    ],
    forms: [
      { code: "0", label: "就業形態計", level: 0 },
      { code: "1", label: "一般労働者", level: 0 },
      { code: "2", label: "パートタイム", level: 0 },
    ],
    sexes,
  };

  const hours = {
    year: writeCube(rows, "year", HOUR_METRICS, (r, m) => {
      if (m === "total") return r.hours_total;
      if (m === "scheduled") return r.hours_scheduled;
      if (m === "overtime") return r.hours_overtime;
      return r.days;
    }),
    month: writeCube(rows, "month", HOUR_METRICS, (r, m) => {
      if (m === "total") return r.hours_total;
      if (m === "scheduled") return r.hours_scheduled;
      if (m === "overtime") return r.hours_overtime;
      return r.days;
    }),
    metrics: [
      { code: "total", label: "総実労働時間", level: 0 },
      { code: "scheduled", label: "所定内労働時間", level: 0 },
      { code: "overtime", label: "所定外労働時間", level: 0 },
      { code: "days", label: "出勤日数", level: 0 },
    ],
    forms: wages.forms,
    sexes,
  };

  const employment = {
    year: writeCube(rows, "year", JOB_METRICS, (r, m) => r[m]),
    month: writeCube(rows, "month", JOB_METRICS, (r, m) => r[m]),
    metrics: [
      { code: "workers", label: "常用雇用", level: 0 },
      { code: "part_share", label: "パートタイム労働者比率", level: 0 },
      { code: "hire", label: "入職率", level: 0 },
      { code: "leave", label: "離職率", level: 0 },
      { code: "part_workers", label: "パートタイム労働者数", level: 0 },
      { code: "emp_index", label: "常用雇用指数", level: 0 },
    ],
    forms: wages.forms,
    sexes,
  };

  const prefecture = {
    year: writePrefCube(),
    metrics: [
      { code: "cash", label: "現金給与総額", level: 0 },
      { code: "hours", label: "総実労働時間", level: 0 },
      { code: "workers", label: "常用雇用", level: 0 },
    ],
    prefs: PREFS.map((p) => ({ code: p.code, label: p.label, level: 0 })),
  };

  const meta = {
    source: "厚生労働省「毎月勤労統計調査」全国調査（e-Stat）",
    industry: "調査産業計",
    size: "事業所規模5人以上",
    cpi: "持家の帰属家賃を除く総合。指数の基準年は2020年=100。",
    latestYear,
    latestMonth,
    yearFrom: years[0],
    monthFrom: months[0],
  };

  writeFileSync(resolve(OUT, "wages.json"), JSON.stringify(wages));
  writeFileSync(resolve(OUT, "hours.json"), JSON.stringify(hours));
  writeFileSync(resolve(OUT, "employment.json"), JSON.stringify(employment));
  writeFileSync(resolve(OUT, "prefecture.json"), JSON.stringify(prefecture));
  writeFileSync(resolve(OUT, "meta.json"), JSON.stringify(meta, null, 2) + "\n");
  console.log("years", years[0], latestYear, "months", months[0], latestMonth, "rows", rows.length);
}

main();
