import { readFileSync } from "node:fs";

export function readSjisCsv(path: string): Record<string, string>[] {
  const text = new TextDecoder("shift_jis").decode(readFileSync(path));
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  const header = lines[0]!.split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: Record<string, string> = {};
    for (let i = 0; i < header.length; i++) {
      row[header[i]!] = (cells[i] ?? "").trim();
    }
    return row;
  });
}

export function num(raw: string): number | null {
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
