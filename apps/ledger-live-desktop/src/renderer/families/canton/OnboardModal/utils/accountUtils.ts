import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  getDerivationScheme,
  getDerivationModesForCurrency,
  runAccountDerivationScheme,
} from "@ledgerhq/coin-framework/derivation";
import { emptyHistoryCache } from "@ledgerhq/live-common/account/index";

export const createPlaceholderAccount = (
  currency: CryptoCurrency,
  selectedAccount?: Account,
): Account | null => {
  if (selectedAccount) {
    return selectedAccount;
  }

  if (!currency || !currency.id) {
    return null;
  }

  const derivationMode = getDerivationModesForCurrency(currency)[0];
  const derivationScheme = getDerivationScheme({ derivationMode, currency });
  const freshAddressPath = runAccountDerivationScheme(derivationScheme, currency, {
    account: 0,
  });

  return {
    type: "Account" as const,
    id: `canton-placeholder-${currency.id}`,
    currency,
    freshAddress: "canton-placeholder-address",
    freshAddressPath,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    derivationMode,
    index: 0,
    seedIdentifier: "canton-placeholder",
    used: false,
    blockHeight: 0,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    creationDate: new Date(),
    balanceHistoryCache: emptyHistoryCache,
    swapHistory: [],
  };
};
