// External dependencies
import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  getDerivationScheme,
  getDerivationModesForCurrency,
  runAccountDerivationScheme,
} from "@ledgerhq/coin-framework/derivation";
import { emptyHistoryCache } from "@ledgerhq/live-common/account/index";

/**
 * Creates a placeholder account for Canton onboarding
 * Used when no existing account is available for display purposes
 *
 * @param currency - The cryptocurrency for the account
 * @param selectedAccount - Optional existing account to use instead
 * @returns A placeholder Account object or null if currency is invalid
 */
export const createPlaceholderAccount = (
  currency: CryptoCurrency,
  selectedAccount?: Account,
): Account | null => {
  // Return existing account if provided
  if (selectedAccount) {
    return selectedAccount;
  }

  // Validate currency
  if (!currency?.id) {
    return null;
  }

  try {
    // Get derivation configuration
    const derivationMode = getDerivationModesForCurrency(currency)[0];
    const derivationScheme = getDerivationScheme({ derivationMode, currency });
    const freshAddressPath = runAccountDerivationScheme(derivationScheme, currency, {
      account: 0,
    });

    // Create placeholder account with minimal required properties
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
  } catch (error) {
    console.error("Failed to create placeholder account:", error);
    return null;
  }
};
