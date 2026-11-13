import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import type { Account } from "@ledgerhq/types-live";

export const XRP = getCryptoCurrencyById("ripple");

/** Fixed recipient address used across all scenarios. */
export const RECIPIENT = "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe";

export function makeXrpAccount(address: string): Account {
  const id = `js:2:ripple:${address}:`;
  const { derivationMode } = decodeAccountId(id);
  const scheme = getDerivationScheme({ derivationMode, currency: XRP });
  const index = 0;
  const freshAddressPath = runDerivationScheme(scheme, XRP, {
    account: index,
    node: 0,
    address: 0,
  });

  return {
    type: "Account",
    id,
    xpub: address,
    subAccounts: [],
    seedIdentifier: address,
    used: true,
    swapHistory: [],
    derivationMode,
    currency: XRP,
    index,
    nfts: [],
    freshAddress: address,
    freshAddressPath,
    creationDate: new Date(),
    lastSyncDate: new Date(0),
    blockHeight: 0,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
  };
}
