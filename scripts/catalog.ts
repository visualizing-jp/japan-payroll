/** e-Stat ファイル。tclass 000001144508（実数・指数累積データ）。 */

export const FILES = [
  {
    key: "jissu",
    statsInfId: "000032189776",
    fileKind: "1",
    name: "hon-maikin-k-jissu.csv",
    label: "実数・指数累積データ 実数",
  },
  {
    key: "sisu",
    statsInfId: "000032189777",
    fileKind: "1",
    name: "hon-maikin-k-sisu.csv",
    label: "実数・指数累積データ 指数・伸び率",
  },
] as const;

/** 毎勤原表・年平均確報。性別はここだけ。fileKind は 4 が無ければ 0。 */
export const GENSHYO = [
  { year: 2012, statsInfId: "000031791216" },
  { year: 2013, statsInfId: "000031791217" },
  { year: 2014, statsInfId: "000031791218" },
  { year: 2015, statsInfId: "000031791219" },
  { year: 2016, statsInfId: "000031791220" },
  { year: 2017, statsInfId: "000031791221" },
  { year: 2018, statsInfId: "000031797618" },
  { year: 2019, statsInfId: "000031910781" },
  { year: 2020, statsInfId: "000032058827" },
  { year: 2021, statsInfId: "000032170643" },
  { year: 2022, statsInfId: "000040020341" },
  { year: 2023, statsInfId: "000040143481" },
  { year: 2024, statsInfId: "000040250082" },
  { year: 2025, statsInfId: "000040413195" },
] as const;

/** 厚労省地方調査・年平均 表1（5人以上・調査産業計）。平成以前は 404。 */
export const PREF_FILES = [
  { year: 2019, reiwa: "01" },
  { year: 2020, reiwa: "02" },
  { year: 2021, reiwa: "03" },
  { year: 2022, reiwa: "04" },
  { year: 2023, reiwa: "05" },
  { year: 2024, reiwa: "06" },
  { year: 2025, reiwa: "07" },
] as const;

export function prefUrl(reiwa: string): string {
  return `https://www.mhlw.go.jp/toukei/itiran/roudou/monthly/r${reiwa}/xlsx/${reiwa}C1T1.xlsx`;
}

export const PREFS = [
  { code: "00", label: "全国（全国調査）", aliases: ["全国"] },
  { code: "01", label: "北海道", aliases: ["北海道"] },
  { code: "02", label: "青森", aliases: ["青森"] },
  { code: "03", label: "岩手", aliases: ["岩手"] },
  { code: "04", label: "宮城", aliases: ["宮城"] },
  { code: "05", label: "秋田", aliases: ["秋田"] },
  { code: "06", label: "山形", aliases: ["山形"] },
  { code: "07", label: "福島", aliases: ["福島"] },
  { code: "08", label: "茨城", aliases: ["茨城"] },
  { code: "09", label: "栃木", aliases: ["栃木"] },
  { code: "10", label: "群馬", aliases: ["群馬"] },
  { code: "11", label: "埼玉", aliases: ["埼玉"] },
  { code: "12", label: "千葉", aliases: ["千葉"] },
  { code: "13", label: "東京", aliases: ["東京"] },
  { code: "14", label: "神奈川", aliases: ["神奈川"] },
  { code: "15", label: "新潟", aliases: ["新潟"] },
  { code: "16", label: "富山", aliases: ["富山"] },
  { code: "17", label: "石川", aliases: ["石川"] },
  { code: "18", label: "福井", aliases: ["福井"] },
  { code: "19", label: "山梨", aliases: ["山梨"] },
  { code: "20", label: "長野", aliases: ["長野"] },
  { code: "21", label: "岐阜", aliases: ["岐阜"] },
  { code: "22", label: "静岡", aliases: ["静岡"] },
  { code: "23", label: "愛知", aliases: ["愛知"] },
  { code: "24", label: "三重", aliases: ["三重"] },
  { code: "25", label: "滋賀", aliases: ["滋賀"] },
  { code: "26", label: "京都", aliases: ["京都"] },
  { code: "27", label: "大阪", aliases: ["大阪"] },
  { code: "28", label: "兵庫", aliases: ["兵庫"] },
  { code: "29", label: "奈良", aliases: ["奈良"] },
  { code: "30", label: "和歌山", aliases: ["和歌山"] },
  { code: "31", label: "鳥取", aliases: ["鳥取"] },
  { code: "32", label: "島根", aliases: ["島根"] },
  { code: "33", label: "岡山", aliases: ["岡山"] },
  { code: "34", label: "広島", aliases: ["広島"] },
  { code: "35", label: "山口", aliases: ["山口"] },
  { code: "36", label: "徳島", aliases: ["徳島"] },
  { code: "37", label: "香川", aliases: ["香川"] },
  { code: "38", label: "愛媛", aliases: ["愛媛"] },
  { code: "39", label: "高知", aliases: ["高知"] },
  { code: "40", label: "福岡", aliases: ["福岡"] },
  { code: "41", label: "佐賀", aliases: ["佐賀"] },
  { code: "42", label: "長崎", aliases: ["長崎"] },
  { code: "43", label: "熊本", aliases: ["熊本"] },
  { code: "44", label: "大分", aliases: ["大分"] },
  { code: "45", label: "宮崎", aliases: ["宮崎"] },
  { code: "46", label: "鹿児島", aliases: ["鹿児島"] },
  { code: "47", label: "沖縄", aliases: ["沖縄"] },
] as const;
