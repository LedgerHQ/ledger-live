import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { DEFAULT_ACCOUNT_ID } from "near-sandbox";

export const NETWORK_ID = "sandbox";

/** Every account the scenario touches is a subaccount of the genesis account. */
export const SENDER_ID = `sender.${DEFAULT_ACCOUNT_ID}`;
export const NAMED_RECIPIENT_ID = `recipient.${DEFAULT_ACCOUNT_ID}`;
export const POOL_ID = `pool.${DEFAULT_ACCOUNT_ID}`;

/**
 * A 64-character hex address. NEAR creates such an account implicitly on first transfer, which is
 * the branch that costs more than a transfer to an existing account.
 */
export const IMPLICIT_RECIPIENT_ID =
  "4e7de0a21d8a20f970c86b6edf407906d7ba9e205979c3268270eef80a286e2d";

export const NEAR = 10n ** 24n;

export const SENDER_BALANCE = 200n * NEAR;
export const RECIPIENT_BALANCE = 10n * NEAR;
export const POOL_BALANCE = 50n * NEAR;

/** Base URL the coin config points at; msw intercepts it, nothing listens on it. */
export const INDEXER_URL = "http://indexer.coin-tester-near.local";

/** Four epochs of 500 blocks, the pool's `NUM_EPOCHS_TO_UNLOCK`, plus a margin. */
export const EPOCHS_TO_UNLOCK_BLOCKS = 2500;

export const coinConfig = (rpcUrl: string) => () => ({
  status: { type: "active" as const },
  infra: {
    API_NEAR_PRIVATE_NODE: rpcUrl,
    API_NEAR_PUBLIC_NODE: rpcUrl,
    API_NEAR_INDEXER: INDEXER_URL,
    API_NEARBLOCKS_INDEXER: INDEXER_URL,
  },
});

export const NEAR_CURRENCY = getCryptoCurrencyById("near");

/** The account the scenario starts from, before the first sync fills it in. */
export const makeAccount = (address: string): Account => {
  const id = `js:2:${NEAR_CURRENCY.id}:${address}:`;
  const { derivationMode, xpubOrAddress } = decodeAccountId(id);
  const scheme = getDerivationScheme({ derivationMode, currency: NEAR_CURRENCY });
  const index = 0;

  return {
    type: "Account",
    id,
    xpub: xpubOrAddress,
    subAccounts: [],
    seedIdentifier: xpubOrAddress,
    used: true,
    swapHistory: [],
    derivationMode,
    currency: NEAR_CURRENCY,
    index,
    nfts: [],
    freshAddress: xpubOrAddress,
    freshAddressPath: runDerivationScheme(scheme, NEAR_CURRENCY, {
      account: index,
      node: 0,
      address: 0,
    }),
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
  } as unknown as Account;
};
