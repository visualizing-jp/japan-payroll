import { compactText, excelNum, readSheet } from "./excel.ts";

export interface SexRow {
  year: number;
  sex: "1" | "2";
  cash: number | null;
  contractual: number | null;
  special: number | null;
  hours_total: number | null;
  hours_scheduled: number | null;
  hours_overtime: number | null;
  days: number | null;
  workers: number | null;
  part_workers: number | null;
}

const SIZES = new Set(["T", "0", "1", "4", "5", "7", "9"]);

/** 調査産業計・5人以上の男/女（形態計）。一般/パートは取らない。 */
export function readGenshyo(path: string, year: number): SexRow[] {
  const rows = readSheet(path);
  let inTl = false;
  let inSizeT = false;
  const out: SexRow[] = [];

  for (const row of rows) {
    const size = compactText(row[0]);
    if (size === "TL") {
      inTl = true;
      inSizeT = false;
      continue;
    }
    if (!inTl) continue;
    if (size === "T") inSizeT = true;
    else if (SIZES.has(size)) break;
    if (!inSizeT) continue;

    const sex = compactText(row[1]);
    const form = compactText(row[2]);
    if (form !== "T") continue;
    if (sex !== "M" && sex !== "F") continue;

    out.push({
      year,
      sex: sex === "M" ? "1" : "2",
      workers: excelNum(row[6]),
      part_workers: excelNum(row[7]),
      days: excelNum(row[8]),
      hours_total: excelNum(row[9]),
      hours_scheduled: excelNum(row[10]),
      hours_overtime: excelNum(row[11]),
      cash: excelNum(row[12]),
      contractual: excelNum(row[13]),
      special: excelNum(row[16]),
    });
  }

  if (out.length !== 2) throw new Error(`${path}: 男/女が ${out.length} 行`);
  return out;
}
