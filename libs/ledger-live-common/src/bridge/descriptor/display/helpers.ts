import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountLike } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "../../../currencies";
import type { DisplayTokenItem, DisplayTxItem } from "../types";

/**
 * Maximum number of recent transactions exposed by the Display POC.
 */
const RECENT_TX_LIMIT = 5;

/**
 * Default `getBalance` implementation.
 *
 * Formats `account.balance` with the family's main unit (BTC, ETH, …).
 * Families plug this directly into their `DisplayDescriptor` literal — same
 * style as Send's `applyMemoToTransaction` helper.
 */
export function getDefaultBalance(account: AccountLike): string {
  const currency = getAccountCurrency(account);
  return formatCurrencyUnit(currency.units[0], account.balance, {
    showCode: true,
    disableRounding: false,
  });
}

/**
 * Default `getRecentTransactions` implementation.
 *
 * Returns up to 5 most recent operations from `account.operations`, mapped to
 * a generic shape and formatted with the family's main unit.
 */
export function getDefaultRecentTransactions(account: AccountLike): readonly DisplayTxItem[] {
  const currency = getAccountCurrency(account);
  const unit = currency.units[0];

  return account.operations.slice(0, RECENT_TX_LIMIT).map(op => ({
    hash: op.hash,
    type: op.type === "OUT" ? "send" : "receive",
    amount: formatCurrencyUnit(unit, op.value, {
      showCode: true,
      disableRounding: false,
    }),
    date: op.date.toISOString().slice(0, 10),
  }));
}

/**
 * Default `getTokens` implementation for families that support sub-tokens.
 *
 * Extracts `account.subAccounts` (TokenAccounts) and formats each with its
 * own unit.
 */
export function getDefaultTokens(account: AccountLike): readonly DisplayTokenItem[] {
  // Only parent accounts can carry sub-accounts (TokenAccounts).
  if (account.type !== "Account") return [];
  const subs = account.subAccounts ?? [];

  return subs.map(sub => {
    const subCurrency = getAccountCurrency(sub);
    return {
      symbol: subCurrency.ticker,
      name: subCurrency.name,
      balance: formatCurrencyUnit(subCurrency.units[0], sub.balance, {
        showCode: true,
        disableRounding: false,
      }),
    };
  });
}

/**
 * Stable empty-tokens implementation for families that don't support tokens.
 *
 * Use this as `getTokens` when `hasTokens: false`. The flow won't actually
 * reach the Tokens step in that case, but wiring a real function keeps the
 * descriptor shape consistent across all families.
 */
export const getEmptyTokens = (): readonly DisplayTokenItem[] => [];
