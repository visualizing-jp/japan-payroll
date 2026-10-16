import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";

export function readSheet(path: string): unknown[][] {
  const wb = XLSX.read(readFileSync(path), { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]!];
  if (sheet === undefined) throw new Error(`${path}: シートが無い`);
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
}

export function excelNum(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = String(value)
    .replace(/,/g, "")
    .replace(/[−－―]/g, "-")
    .trim();
  if (text === "" || text === "-") return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

export function compactText(value: unknown): string {
  return String(value ?? "").replace(/[\s\u3000]+/g, "");
}
