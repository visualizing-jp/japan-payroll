import { Suspense } from "react";
import { SeriesBar, SeriesFooter, SITE_TITLE } from "./components/Brand.tsx";
import { WagesView } from "./views/WagesView.tsx";
import { HoursView } from "./views/HoursView.tsx";
import { EmploymentView } from "./views/EmploymentView.tsx";
import { PrefectureView } from "./views/PrefectureView.tsx";
import { useUrlState } from "./hooks/useUrlState.ts";
import type { ViewId } from "./data/chunks.ts";

const VIEWS = [
  { id: "wages", label: "給与", hint: "名目・実質" },
  { id: "hours", label: "労働時間", hint: "所定内外" },
  { id: "employment", label: "雇用", hint: "常用・パート" },
  { id: "prefecture", label: "地方", hint: "都道府県" },
] as const;

export function App() {
  const [view, setView] = useUrlState<ViewId>("view", "wages", (v) =>
    VIEWS.some((x) => x.id === v),
  );

  return (
    <div className="min-h-dvh">
      <header className="border-b border-rule bg-paper/85 backdrop-blur-sm">
        <SeriesBar />
        <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-end justify-between gap-4 px-6 pt-5">
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight">{SITE_TITLE}</h1>
            <p className="text-[11px] text-muted">
              厚生労働省「毎月勤労統計調査」
              {view === "prefecture" ? "地方調査" : "全国調査"}
            </p>
          </div>
          <nav className="flex gap-1 -mb-px" aria-label="ビュー">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                aria-current={view === v.id ? "page" : undefined}
                className={`cursor-pointer border-b-2 px-3 pt-1 pb-2 text-[13px] transition-colors duration-150 ease-[var(--ease-out)] active:scale-[0.97] ${
                  view === v.id
                    ? "border-accent font-semibold text-ink"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {v.label}
                <span className="ml-1.5 text-[10px] font-normal text-faint">{v.hint}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <Suspense key={view} fallback={<Loading />}>
        {view === "wages" && <WagesView />}
        {view === "hours" && <HoursView />}
        {view === "employment" && <EmploymentView />}
        {view === "prefecture" && <PrefectureView />}
      </Suspense>

      <footer className="mx-auto w-full max-w-[1240px] px-6 pt-2 pb-10 text-[11px] leading-relaxed text-faint">
        {view === "prefecture"
          ? "出典: 厚生労働省「毎月勤労統計調査」地方調査・年平均 表1。調査産業計、事業所規模5人以上。全国の行は全国調査で、地方調査の合計でも平均でもない。"
          : "出典: 厚生労働省「毎月勤労統計調査」全国調査（e-Stat）。調査産業計、事業所規模5人以上。常用は期間の定めなし、または1か月以上。年次は1990年〜、一般・パートは1993年〜、性別は2012年〜。実質賃金は持家の帰属家賃を除く総合、2020年=100。"}
        <SeriesFooter />
      </footer>
    </div>
  );
}

function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-16 text-[12px] text-faint">読み込み中</div>
  );
}
