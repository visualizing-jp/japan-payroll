import { use } from "react";
import { loadWages } from "../data/chunks.ts";
import { SeriesView, timeNumber } from "./SeriesView.tsx";
import type { Panel } from "../components/TrendStack.tsx";

export function WagesView() {
  const pack = use(loadWages());
  return (
    <SeriesView
      pack={pack}
      extra={(metric, form, grain, sex) => {
        if (metric !== "cash") return [];
        const cube = grain === "year" ? pack.year : pack.month;
        const times = cube.codes("time");
        const real = cube.series("value", "time", { form, sex, metric: "real_cash" });
        if (real.every((v) => v === null)) return [];
        const panel: Panel = {
          key: "real_cash",
          title: "実質賃金（現金給与総額）",
          unit: "2020年=100",
          format: (v) => v.toFixed(1),
          formatTick: (v) => v.toFixed(1),
          series: [
            {
              key: "real_cash",
              label: "",
              emphasized: true,
              points: times.map((t, i) => ({ year: timeNumber(t), value: real[i] ?? null })),
            },
          ],
        };
        return [panel];
      }}
    />
  );
}
