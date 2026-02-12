import { BigNumber } from "bignumber.js";
import { CardanoAccount, CardanoDelegation } from "../types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { BalanceHistoryCache } from "@ledgerhq/types-live";

export const getCardanoAccountFixture = (params: {
  delegation?: Partial<CardanoDelegation>;
}): CardanoAccount => ({
  type: "Account",
  id: "cardano-testnet-1",
  xpub: "2b7203eaac6970424a3c03c6523d73d5c5c8608bbdb2da6cac0fa818a550070226ff4d533833edaf32c8153559089195376128ae9f533a5e89fc4c256a50f6df",
  seedIdentifier: "",
  derivationMode: "cardano",
  index: 0,
  freshAddress: "addr_test1...",
  freshAddressPath: "1852'/1815'/0'/0/0",
  used: false,
  balance: new BigNumber(1000000),
  spendableBalance: new BigNumber(1000000),
  balanceHistoryCache: {} as BalanceHistoryCache,
  creationDate: new Date(),
  blockHeight: 0,
  currency: {
    id: "cardano_testnet",
    units: [{ name: "Cardano", code: "ADA", magnitude: 6 }],
  } as CryptoCurrency,
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  lastSyncDate: new Date(),
  swapHistory: [],
  cardanoResources: {
    externalCredentials: [
      {
        isUsed: true,
        key: "bd2717d482fa89b20f7ba1299344d203d14cfa231d8da9847aa51e07",
        path: {
          account: 0,
          chain: 0,
          coin: 1815,
          index: 0,
          purpose: 1852,
        },
      },
    ],
    internalCredentials: [
      {
        isUsed: false,
        key: "cdc820fc923c1f0c21eda007b83b15da770edee5f7d8fc9e77bf02ba",
        path: {
          account: 0,
          chain: 1,
          coin: 1815,
          index: 0,
          purpose: 1852,
        },
      },
    ],
    utxos: [
      {
        hash: "e807160f59455ffc011e6d0a48c0922645797707b8520788f176ca21f2b49561",
        index: 0,
        address:
          "00bd2717d482fa89b20f7ba1299344d203d14cfa231d8da9847aa51e07db5e8ece0982acc4883de67c2e3411cc26bd56686a162074998c02bc",
        amount: new BigNumber(100e6),
        tokens: [],
        paymentCredential: {
          key: "bd2717d482fa89b20f7ba1299344d203d14cfa231d8da9847aa51e07",
          path: {
            account: 0,
            chain: 0,
            coin: 1815,
            index: 0,
            purpose: 1852,
          },
        },
      },
    ],
    delegation: params.delegation as any,
    protocolParams: {} as any,
  },
});
