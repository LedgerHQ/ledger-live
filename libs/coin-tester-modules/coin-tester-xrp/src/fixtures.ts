import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import type { Account } from "@ledgerhq/types-live";

export const XRP = getCryptoCurrencyById("ripple");

export const XRP_LOCAL_RPC = "http://127.0.0.1:5005";

/**
 * The XRPL family seed for the genesis "masterpassphrase" account, which
 * holds the full 100B XRP supply at the start of a `--standalone --start`
 * network. Decodes to address `rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh`.
 */
export const GENESIS_SEED = "snoPBrXtMeMyMHUVTgbuqAfg1SUTb";
export const GENESIS_ADDRESS = "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh";

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
