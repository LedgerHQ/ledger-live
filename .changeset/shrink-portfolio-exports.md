---
"@ledgerhq/live-countervalues": minor
---

Reduce `portfolio.ts` export surface from 19 to 10. The 9 symbols that nothing outside the file imported (`startOfHour`, `startOfDay`, `startOfWeek`, `getRanges`, `getDates`, `getPortfolioRangeConfig`, `getPortfolioCountByDate`, `defaultAssetsDistribution`, `AssetsDistributionOpts`) are relocated to two internal modules (`src/internal/ranges.ts` and `src/internal/assetsDistribution.ts`) and re-imported by `portfolio.ts`. No behaviour change; the internal modules are a staging home until the package gains an explicit `exports` map.
