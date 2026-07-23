import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  encodeAccountId,
  decodeAccountId,
} from "@ledgerhq/ledger-wallet-framework/account/accountId";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import type { HederaAccount } from "@ledgerhq/coin-hedera/types";

export const HEDERA = getCryptoCurrencyById("hedera");

/**
 * Local Solo's consensus endpoint; the port can differ between Solo versions — confirm
 * against the live deploy output before running.
 */
export const LOCAL_CONSENSUS_NODES: Record<string, string> = { "127.0.0.1:35211": "0.0.3" };
export const LOCAL_MIRROR_NODE_URL = "http://127.0.0.1:38081";

/**
 * Fake hgraph URL served only by indexer.ts's MSW handler — must resolve to something
 * since coin-hedera calls hgraph unconditionally.
 */
export const FAKE_HGRAPH_URL = "http://127.0.0.1:19999/hgraph";

/**
 * An existing Solo-funded account used only as the send recipient. Its own
 * key is irrelevant — the recipient never signs anything in this scenario.
 */
export const RECIPIENT = "0.0.1002";

/**
 * `accountId` comes from the AccountCreateTransaction receipt, never hard-coded.
 * `seedIdentifier` is the raw Ed25519 public key hex.
 */
export function makeHederaAccount(accountId: string, publicKey: string): HederaAccount {
  const id = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: HEDERA.id,
    xpubOrAddress: accountId,
    derivationMode: "hederaBip44",
  });
  const { derivationMode } = decodeAccountId(id);
  const scheme = getDerivationScheme({ derivationMode, currency: HEDERA });
  const freshAddressPath = runDerivationScheme(scheme, HEDERA, {});

  return {
    type: "Account",
    id,
    seedIdentifier: publicKey,
    derivationMode,
    index: 0,
    freshAddress: accountId,
    freshAddressPath,
    used: false,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    blockHeight: 0,
    currency: HEDERA,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(0),
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
    subAccounts: [],
  };
}
