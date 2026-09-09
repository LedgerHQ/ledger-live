---
"@ledgerhq/live-countervalues": minor
"@ledgerhq/live-countervalues-react": minor
"@ledgerhq/live-common": minor
---

Move portfolio and account-coupled logic to live-common

`portfolio.ts`, the React `portfolioReact.tsx`, the internal `ranges.ts` and `assetsDistribution.ts`
helpers, and the `inferTrackingPairForAccounts*` tests migrate from the countervalues packages into
`libs/ledger-live-common/src/portfolio/`. This removes the account-entity blocker from the
countervalues epic: `live-countervalues` is now rate logic only.

`live-countervalues`: `portfolio` entry point removed; `src/internal/` directory removed.
`live-countervalues-react`: `portfolio` entry point removed; package now contains only `index.tsx`.
`live-common`: `portfolio/portfolio` and `portfolio/portfolioReact` entry points added.
