import BigNumber from "bignumber.js";
import { TezosAccount } from "../types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

export function makeAccount(
  _name: string,
  pubkey: string,
  address: string,
  isRevelead: boolean,
): TezosAccount {
  return {
    id: `js:2:tezos:${pubkey}:${"standard"}`,
    seedIdentifier: address,
    derivationMode: "",
    index: 0,
    freshAddress: address,
    freshAddressPath: "",
    blockHeight: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    balance: new BigNumber(0),
    xpub: pubkey,
    subAccounts: [],
    type: "Account",
    used: true,
    spendableBalance: new BigNumber(100),
    creationDate: new Date(),
    currency: getCryptoCurrencyById("tezos"),
    operationsCount: 0,
    swapHistory: [],
    balanceHistoryCache: {
      WEEK: { latestDate: 0, balances: [] },
      DAY: { latestDate: 0, balances: [] },
      HOUR: { latestDate: 0, balances: [] },
    },
    tezosResources: { revealed: isRevelead, counter: 0 },
  };
}
