import BigNumber from "bignumber.js";
import { TezosAccount } from "../types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

export function makeAccount(
  name: string,
  pubkey: string,
  address: string,
  isRevelead: boolean,
): TezosAccount {
  return {
    id: `js:2:tezos:${pubkey}:${"standard"}`,
    seedIdentifier: address,
    name: "Tezos " + name,
    derivationMode: "",
    index: 0,
    freshAddress: address,
    freshAddressPath: "",
    freshAddresses: [],
    blockHeight: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    balance: new BigNumber(0),
    xpub: pubkey,
    subAccounts: [],
    type: "Account",
    starred: false,
    used: true,
    spendableBalance: new BigNumber(100),
    creationDate: new Date(),
    currency: getCryptoCurrencyById("tezos"),
    unit: { name: "xtz", code: "xtz", magnitude: 6 },
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
