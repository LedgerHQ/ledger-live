import { currency } from "../define";

/**
 * Testnet counterpart of `zcash`, served by the sideloaded `Zcash Test` app.
 *
 * Unlike `zcash_regtest`, it keeps Zcash's own testnet coin type and address
 * encodings (`tm...`/`t2...`, UA HRP `utest`).
 */
export const zcash_testnet = currency({
  type: "CryptoCurrency",
  id: "zcash_testnet",
  coinType: 1,
  name: "Zcash Testnet",
  managerAppName: "Zcash Test",
  ticker: "ZEC",
  scheme: "zcash_testnet",
  color: "#3790ca",
  family: "bitcoin",
  blockAvgTime: 150,
  units: [
    {
      name: "zcash",
      code: "𝚝ZEC",
      magnitude: 8,
    },
    {
      name: "satoshi",
      code: "𝚝sat",
      magnitude: 0,
    },
  ],
  isTestnetFor: "zcash",
  explorerViews: [],
});
