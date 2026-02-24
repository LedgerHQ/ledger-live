/**
 * Choix Alpaca vs Bridge par famille de currency.
 * Aligné sur libs/ledger-live-common/src/bridge/impl.ts (alpacaized).
 *
 * - isAlpacaForCurrency(currencyId) / isAlpacaForAccountId(accountId) : true pour
 *   evm, xrp, stellar, tezos. Ces familles ont une API Alpaca (getBalance, listOperations, etc.).
 * - Alpaca path : pas de bridge. On appelle directement getAlpacaApi(currencyId, "local")
 *   puis getBalance, lastBlock, listOperations ; on construit AccountV4 et les slices
 *   (voir data-layer/accounts/fetchAccountViaAlpaca.ts et les thunks operationHistory / balanceHistory).
 */
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

const ALPACA_FAMILIES: Record<string, boolean> = {
  evm: true,
  xrp: true,
  stellar: true,
  tezos: true,
};

export function isAlpacaForCurrency(currencyId: string): boolean {
  try {
    const currency = getCryptoCurrencyById(currencyId);
    return Boolean(ALPACA_FAMILIES[currency.family]);
  } catch {
    return false;
  }
}

import { decodeAccountId } from "@ledgerhq/live-common/account/index";

export function isAlpacaForAccountId(accountId: string): boolean {
  const { currencyId } = decodeAccountId(accountId);
  return isAlpacaForCurrency(currencyId);
}
