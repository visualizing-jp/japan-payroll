import { PREFS } from "./catalog.ts";
import { compactText, excelNum, readSheet } from "./excel.ts";

export interface PrefRow {
  year: number;
  pref: string;
  workers: number | null;
  hours: number | null;
  cash: number | null;
}

const BY_ALIAS = new Map<string, string>();
for (const pref of PREFS) {
  for (const alias of pref.aliases) BY_ALIAS.set(alias, pref.code);
}

export function readPrefTable(path: string, year: number): PrefRow[] {
  const rows = readSheet(path);
  const out: PrefRow[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const name = compactText(row[0]);
    const code = BY_ALIAS.get(name);
    if (code === undefined) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    const thousand = excelNum(row[1]);
    out.push({
      year,
      pref: code,
      workers: thousand === null ? null : Math.round(thousand * 1000),
      hours: excelNum(row[2]),
      cash: excelNum(row[6]),
    });
  }

  if (out.length !== PREFS.length) {
    throw new Error(`${path}: 地域が ${out.length}（期待 ${PREFS.length}）`);
  }
  return out;
}
