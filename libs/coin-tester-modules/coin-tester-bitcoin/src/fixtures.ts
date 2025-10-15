/* instanbul ignore file: don't test fixtures */

import BigNumber from "bignumber.js";
import { getDerivationScheme, runDerivationScheme } from "@ledgerhq/coin-framework/derivation";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
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
