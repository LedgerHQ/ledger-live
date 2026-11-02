/* istanbul ignore file: don't test fixtures */

import BigNumber from "bignumber.js";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { DerivationMode } from "@ledgerhq/types-live";
import { BitcoinAccount } from "@ledgerhq/coin-bitcoin/types";

export const makeAccount = (
  xpub: string,
  publicKey: string,
  address: string,
  currency: CryptoCurrency,
  derivationMode: DerivationMode,
): BitcoinAccount => {
  const id = `js:2:${currency.id}:${xpub}:${derivationMode}`;
  const scheme = getDerivationScheme({
    derivationMode: derivationMode as DerivationMode,
    currency,
  });
  const index = 0;
  const freshAddressPath = runDerivationScheme(scheme, currency, {
    account: index,
    node: 0,
    address: 0,
  });

  return {
    type: "Account",
    id: id,
    seedIdentifier: publicKey,
    derivationMode: derivationMode,
    index: 0,
    freshAddress: address,
    freshAddressPath: freshAddressPath,
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
  };
};

/**
 * Account for the **generic-adapter** strategy. coin-bitcoin's Alpaca API manages a single address,
 * so the account is that address: it is the `xpubOrAddress` segment of the id (which the generic
 * framework passes to `getBalance` / `listOperations`) and the fresh address (the intent's sender).
 * `freshAddressPath` is what the framework hands the signer.
 */
export const makeGenericAdapterAccount = (
  address: string,
  publicKey: string,
  freshAddressPath: string,
  currency: CryptoCurrency,
): BitcoinAccount => ({
  ...makeAccount(address, publicKey, address, currency, "native_segwit"),
  id: `js:2:${currency.id}:${address}:native_segwit`,
  freshAddressPath,
});
