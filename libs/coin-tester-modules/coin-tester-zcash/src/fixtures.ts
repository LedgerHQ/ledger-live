/* istanbul ignore file: don't test fixtures */

import BigNumber from "bignumber.js";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { DerivationMode } from "@ledgerhq/types-live";
import { ZcashAccount } from "@ledgerhq/coin-zcash/types/bridge";
import { DEFAULT_ZCASH_PRIVATE_INFO } from "@ledgerhq/coin-zcash/constants";

/**
 * Builds the initial `ZcashAccount`, already carrying the account's own UFVK
 * (known upfront -- the test signer derives it locally, no device export flow
 * needed) so the shielded sync leg activates from the account's very first
 * `sync()` call. `syncState: "ready"` is required: `DEFAULT_ZCASH_PRIVATE_INFO`
 * itself starts at `"disabled"`, which `buildExtraSyncObservable` treats as
 * shielded sync never having been turned on for this account.
 */
export const makeAccount = (
  xpub: string,
  publicKey: string,
  address: string,
  currency: CryptoCurrency,
  derivationMode: DerivationMode,
  ufvk: string,
): ZcashAccount => {
  const id = `js:2:${currency.id}:${xpub}:${derivationMode}`;
  const scheme = getDerivationScheme({ derivationMode, currency });
  const index = 0;
  const freshAddressPath = runDerivationScheme(scheme, currency, {
    account: index,
    node: 0,
    address: 0,
  });

  return {
    type: "Account",
    id,
    seedIdentifier: publicKey,
    derivationMode,
    index: 0,
    freshAddress: address,
    freshAddressPath,
    used: true,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    blockHeight: 0,
    currency,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    balanceHistoryCache: {
      HOUR: {
        latestDate: null,
        balances: [],
      },
      DAY: {
        latestDate: null,
        balances: [],
      },
      WEEK: {
        latestDate: null,
        balances: [],
      },
    },
    swapHistory: [],

    bitcoinResources: {
      utxos: [],
    },

    privateInfo: {
      ...DEFAULT_ZCASH_PRIVATE_INFO,
      ufvk,
      syncState: "ready",
      birthday: null,
    },
  };
};
