import { CubeView, type CubeJson, type DictEntry } from "./cube.ts";

export type Form = "0" | "1" | "2";
export type Sex = "0" | "1" | "2";
export type Grain = "year" | "month";
export type ViewId = "wages" | "hours" | "employment" | "prefecture";

export interface GrainCube {
  year: CubeJson;
  month: CubeJson;
  metrics: DictEntry[];
  forms: DictEntry[];
  sexes: DictEntry[];
}

export interface PrefCube {
  year: CubeJson;
  metrics: DictEntry[];
  prefs: DictEntry[];
}

export interface Meta {
  source: string;
  industry: string;
  size: string;
  cpi: string;
  latestYear: string;
  latestMonth: string;
  yearFrom: string;
  monthFrom: string;
}

export interface Pack {
  metrics: DictEntry[];
  forms: DictEntry[];
  year: CubeView;
  month: CubeView;
}

const cache = new Map<string, Promise<unknown>>();

function chunk<T>(name: string, transform: (raw: unknown) => T): Promise<T> {
  const hit = cache.get(name);
  if (hit !== undefined) return hit as Promise<T>;
  const promise = fetch(`${import.meta.env.BASE_URL}data/${name}.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`${name}.json の取得に失敗しました (${r.status})`);
      return r.json();
    })
    .then(transform);
  cache.set(name, promise);
  return promise;
}

function toPack(raw: GrainCube): Pack {
  return {
    metrics: raw.metrics,
    forms: raw.forms,
    year: new CubeView(raw.year),
    month: new CubeView(raw.month),
  };
}

export function loadWages(): Promise<Pack> {
  return chunk("wages", (raw) => toPack(raw as GrainCube));
}

export function loadHours(): Promise<Pack> {
  return chunk("hours", (raw) => toPack(raw as GrainCube));
}

export function loadEmployment(): Promise<Pack> {
  return chunk("employment", (raw) => toPack(raw as GrainCube));
}

export function loadPrefecture(): Promise<PrefPack> {
  return chunk("prefecture", (raw) => {
    const pack = raw as PrefCube;
    return {
      metrics: pack.metrics,
      prefs: pack.prefs,
      year: new CubeView(pack.year),
    };
  });
}

export interface PrefPack {
  metrics: DictEntry[];
  prefs: DictEntry[];
  year: CubeView;
}

export function loadMeta(): Promise<Meta> {
  return chunk("meta", (raw) => raw as Meta);
}
