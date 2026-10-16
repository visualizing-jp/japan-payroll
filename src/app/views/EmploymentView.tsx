import { use } from "react";
import { loadEmployment } from "../data/chunks.ts";
import { SeriesView, flowRateSeries, timeNumber } from "./SeriesView.tsx";
import type { Panel } from "../components/TrendStack.tsx";

export function EmploymentView() {
  const pack = use(loadEmployment());
  return (
    <SeriesView
      pack={pack}
      extra={(metric, form, grain, sex) => {
        if (metric !== "hire") return [];
        const cube = grain === "year" ? pack.year : pack.month;
        const times = cube.codes("time");
        const leave = cube.series("value", "time", { form, sex, metric: "leave" });
        if (leave.every((v) => v === null)) return [];
        const points = times.map((t, i) => ({ year: timeNumber(t), value: leave[i] ?? null }));
        const panel: Panel = {
          key: "leave",
          title: "離職率",
          unit: "%",
          format: (v) => `${(v * 100).toFixed(1)}%`,
          formatTick: (v) => `${(v * 100).toFixed(1)}%`,
          series: flowRateSeries("leave", points, grain),
        };
        return [panel];
      }}
    />
  );
}
