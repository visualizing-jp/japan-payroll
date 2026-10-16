import { use } from "react";
import { loadHours } from "../data/chunks.ts";
import { SeriesView } from "./SeriesView.tsx";

export function HoursView() {
  const pack = use(loadHours());
  return <SeriesView pack={pack} />;
}
