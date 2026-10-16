/**
 * 2025年 CY・調査産業計・5人以上・就業形態計の実測値で健全性を見る。
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CubeView } from "../src/app/data/cube.ts";

const OUT = resolve(import.meta.dirname, "../public/data");

interface Pack {
  year: { dims: { name: string; codes: string[] }[]; measures: Record<string, (number | null)[]> };
}

function load(name: string): Pack {
  return JSON.parse(readFileSync(resolve(OUT, `${name}.json`), "utf8")) as Pack;
}

function must(cond: boolean, message: string): void {
  if (!cond) throw new Error(message);
}

function main(): void {
  const wages = new CubeView(load("wages").year);
  const hours = new CubeView(load("hours").year);
  const jobs = new CubeView(load("employment").year);
  const meta = JSON.parse(readFileSync(resolve(OUT, "meta.json"), "utf8")) as {
    latestYear: string;
    latestMonth: string;
  };

  const cash = wages.at("value", { form: "0", sex: "0", metric: "cash", time: "2025" });
  const real = wages.at("value", { form: "0", sex: "0", metric: "real_cash", time: "2025" });
  const total = hours.at("value", { form: "0", sex: "0", metric: "total", time: "2025" });
  const workers = jobs.at("value", { form: "0", sex: "0", metric: "workers", time: "2025" });
  const share = jobs.at("value", { form: "0", sex: "0", metric: "part_share", time: "2025" });
  const men = wages.at("value", { form: "0", sex: "1", metric: "cash", time: "2025" });
  const women = wages.at("value", { form: "0", sex: "2", metric: "cash", time: "2025" });
  const menHours = hours.at("value", { form: "0", sex: "1", metric: "total", time: "2025" });
  const menSched = wages.at("value", { form: "0", sex: "1", metric: "scheduled", time: "2025" });
  const menForm = wages.at("value", { form: "1", sex: "1", metric: "cash", time: "2025" });
  const menOld = wages.at("value", { form: "0", sex: "1", metric: "cash", time: "2011" });
  const men2012 = wages.at("value", { form: "0", sex: "1", metric: "cash", time: "2012" });

  const pref = new CubeView(load("prefecture").year);
  const tokyo = pref.at("value", { pref: "13", metric: "cash", time: "2025" });
  const national = pref.at("value", { pref: "00", metric: "cash", time: "2025" });

  must(cash === 355941, `cash 2025 = ${cash}`);
  must(real === 98, `real 2025 = ${real}`);
  must(total === 135.1, `hours 2025 = ${total}`);
  must(workers === 51566253, `workers 2025 = ${workers}`);
  must(share === 0.3131, `part_share 2025 = ${share}`);
  must(men === 449528, `men cash 2025 = ${men}`);
  must(women === 255918, `women cash 2025 = ${women}`);
  must(menHours === 150, `men hours 2025 = ${menHours}`);
  must(menSched === null, `men scheduled should be null`);
  must(menForm === null, `form×sex should be null`);
  must(menOld === null, `2011 men should be null`);
  must(men2012 === 401795, `men cash 2012 = ${men2012}`);
  must(tokyo === 459078, `tokyo cash 2025 = ${tokyo}`);
  must(national === 355941, `pref 全国 cash 2025 = ${national}`);
  must(pref.codes("pref").length === 48, `prefs ${pref.codes("pref").length}`);
  must(meta.latestYear === "2025", `latestYear ${meta.latestYear}`);
  must(meta.latestMonth === "2026-07", `latestMonth ${meta.latestMonth}`);
  must(wages.codes("time")[0] === "1990", `first year ${wages.codes("time")[0]}`);
  must(wages.at("value", { form: "0", sex: "0", metric: "cash", time: "1990" }) === 329443, "1990 cash");
  console.log("ok");
}

main();
