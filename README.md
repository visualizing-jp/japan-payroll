# 事業所は人をどう雇い、いくら払い、何時間働かせてきたか

厚生労働省「毎月勤労統計調査」全国調査から、給与・労働時間・雇用を探索するサイト。

visualizing.jp スタンドアロン（dataviz.jp サブスクツールではない）。japan-data ハブには載せない。

想定URL: https://japan-payroll.visualizing.jp

## 開発

```bash
npm install
npm run fetch && npm run data && npm run verify
npm run dev
```

| スクリプト | 内容 |
| --- | --- |
| `npm run fetch` | e-Stat 累積 CSV、年次原表、地方調査表1 |
| `npm run data` | 配信用 cube |
| `npm run verify` | 2025年の実測値チェック |
| `npm run dev` | Vite 開発サーバ |
| `npm run build` | 本番ビルド |
| `npm run typecheck` | TypeScript 検査 |

データ設計の正本は [`docs/data-sources.md`](docs/data-sources.md)。

## 画面

給与・労働時間・雇用・地方のビューを同じサイトで切り替える。`?view=wages|hours|employment|prefecture`（既定は給与）。性別は全国調査の年次。地方は地方調査で全国値と足さない。japan-data ハブには載せない。表紙サイトは置かない。

## GitHub Pages / DNS

`.github/workflows/pages.yml` で Pages にデプロイする。
カスタムドメイン `japan-payroll.visualizing.jp` は、Pages 設定と visualizing.jp 側 DNS（既存シリーズと同じ運用）で登録する。
