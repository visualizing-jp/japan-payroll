/**
 * 累積 CSV・年次原表・地方調査表1を data/raw/ へ置く。API キーは不要。
 */

import { copyFileSync, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { FILES, GENSHYO, PREF_FILES, prefUrl } from "./catalog.ts";

const RAW = resolve(import.meta.dirname, "../data/raw");
const STASH = resolve(import.meta.dirname, "../../.tmp-estat");
const UA = { "User-Agent": "Mozilla/5.0 japan-payroll.visualizing.jp" };

async function get(url: string): Promise<Buffer | null> {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) return null;
  const type = res.headers.get("content-type") ?? "";
  if (type.includes("text/html")) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 5_000) return null;
  return buf;
}

async function download(name: string, url: string, force: boolean): Promise<void> {
  const out = resolve(RAW, name);
  if (!force && existsSync(out)) {
    console.log("skip", name);
    return;
  }
  const stash = resolve(STASH, name === "hon-maikin-k-jissu.csv" ? "jissu.csv" : "sisu.csv");
  if (!force && existsSync(stash)) {
    copyFileSync(stash, out);
    console.log("copy", name, statSync(out).size);
    return;
  }
  const buf = await get(url);
  if (buf === null) throw new Error(`download failed ${name}`);
  writeFileSync(out, buf);
  console.log("ok", name, buf.length);
}

async function downloadGenshyo(year: number, statsInfId: string, force: boolean): Promise<void> {
  const dir = resolve(RAW, "genshyo");
  mkdirSync(dir, { recursive: true });
  const out = resolve(dir, `${year}.xls`);
  if (!force && existsSync(out) && statSync(out).size > 5_000) {
    console.log("skip", `genshyo/${year}.xls`);
    return;
  }
  for (const kind of ["4", "0"]) {
    const buf = await get(
      `https://www.e-stat.go.jp/stat-search/file-download?statInfId=${statsInfId}&fileKind=${kind}`,
    );
    if (buf === null) continue;
    writeFileSync(out, buf);
    console.log("ok", `genshyo/${year}.xls`, buf.length, `kind=${kind}`);
    return;
  }
  throw new Error(`genshyo ${year} ${statsInfId}`);
}

async function downloadPref(year: number, reiwa: string, force: boolean): Promise<void> {
  const dir = resolve(RAW, "pref");
  mkdirSync(dir, { recursive: true });
  const out = resolve(dir, `${year}.xlsx`);
  if (!force && existsSync(out) && statSync(out).size > 5_000) {
    console.log("skip", `pref/${year}.xlsx`);
    return;
  }
  const buf = await get(prefUrl(reiwa));
  if (buf === null) throw new Error(`pref ${year}`);
  writeFileSync(out, buf);
  console.log("ok", `pref/${year}.xlsx`, buf.length);
}

async function main(): Promise<void> {
  mkdirSync(RAW, { recursive: true });
  const force = process.argv.includes("--force");
  for (const file of FILES) {
    await download(
      file.name,
      `https://www.e-stat.go.jp/stat-search/file-download?statInfId=${file.statsInfId}&fileKind=${file.fileKind}`,
      force,
    );
  }
  for (const file of GENSHYO) {
    await downloadGenshyo(file.year, file.statsInfId, force);
  }
  for (const file of PREF_FILES) {
    await downloadPref(file.year, file.reiwa, force);
  }
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
