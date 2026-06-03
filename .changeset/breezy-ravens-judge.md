---
"@ledgerhq/wallet-pnl": patch
---

Guard PnL reducers against non-finite counter values (NaN/Infinity). `typeof === "number"` previously let `Infinity` through, which `new BigNumber()` coerces to an internal NaN and poisons every downstream arithmetic op. Replaces the check with `Number.isFinite` at the three call sites (latest CV in `assetPnL`, historical op-date CV in `costBasis`, and the reconciliation delta CV).
