import { currency } from "../define";

/**
 * Regtest counterpart of `zcash`, used only by `@ledgerhq/coin-tester-zcash`
 * against a local zebra + zaino stack.
 *
 * `bitcoinLikeInfo`/`coinType` intentionally mirror the **mainnet** `zcash`
 * entry, not Zcash's own testnet/regtest version bytes: `@ledgerhq/coin-zcash`
 * classifies every recipient address (`logic/address.ts`'s
 * `classifyZcashRecipient`, `logic/validateAddress.ts`) against hardcoded
 * mainnet prefixes only (`t1`/`t3`, UA HRP `"u"`) with no per-network
 * parameterization, and `getTransactionStatus` calls that classifier
 * unconditionally. A genuinely testnet-prefixed address (`tm...`, HRP
 * `"utest"`) would always fail classification and abort every scenario
 * transaction. Reusing the mainnet encoding keeps this currency's own
 * addresses (and the UFVK/PCZT derivation, which shares `coinType`) accepted
 * by that unmodified check; only `id`/`explorerId` differ, so the transparent
 * sync leg and the Zaino gRPC endpoint (set via `setZainoGrpcUrl`) still route
 * to the local regtest stack instead of production.
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
  family: "bitcoin",
  blockAvgTime: 150,
  bitcoinLikeInfo: {
    P2PKH: 7352,
    P2SH: 7357,
    XPUBVersion: 76067358,
  },
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
  disableCountervalue: true,
  explorerViews: [],
  explorerId: "zcash_regtest",
});
