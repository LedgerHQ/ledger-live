import { currency } from "../define";

/**
 * Regtest counterpart of `zcash`, used only by `@ledgerhq/coin-tester-zcash`
 * against a local zebra + zaino stack.
 *
 * `coinType` and the address version bytes intentionally mirror the **mainnet** `zcash`
 * entry, not Zcash's own testnet/regtest version bytes: a local regtest node accepts any
 * encoding, and `@ledgerhq/coin-zcash` maps this currency to the mainnet encodings by id
 * (`logic/network.ts`), so its addresses, UFVK and PCZTs are the mainnet ones. Only `id`
 * differs, so the transparent sync leg and the Zaino gRPC endpoint (the coin config's
 * `zaino.url`) still route to the local regtest stack instead of production.
 */
export const zcash_regtest = currency({
  type: "CryptoCurrency",
  id: "zcash_regtest",
  coinType: 133,
  name: "Zcash Regtest",
  managerAppName: "Zcash Test",
  ticker: "ZEC",
  scheme: "regtest",
  color: "#3790ca",
  family: "zcash",
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
