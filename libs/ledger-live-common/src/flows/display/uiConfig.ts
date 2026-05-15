import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountLike } from "@ledgerhq/types-live";
import { getDisplayDescriptor } from "../../bridge/descriptor/registry";
import type { DisplayFlowUiConfig } from "./types";

const EMPTY_UI_CONFIG: DisplayFlowUiConfig = {
  balance: "0",
  recentTransactions: [],
  hasTokens: false,
  tokens: [],
};

/**
 * Build the Display UI config for a given account.
 *
 * Single bridge between the descriptor layer (per-family methods) and the UI
 * layer (generic React screens). The UI imports nothing else from descriptors.
 *
 * Returns an empty config when the account has no Display descriptor — the
 * dialog should not be reached in that case (the feature flag gates it).
 */
export function getDisplayUiConfig(account: AccountLike | undefined | null): DisplayFlowUiConfig {
  if (!account) return EMPTY_UI_CONFIG;
  const currency = getAccountCurrency(account);
  const descriptor = getDisplayDescriptor(currency);
  if (!descriptor) return EMPTY_UI_CONFIG;

  return {
    balance: descriptor.getBalance(account),
    recentTransactions: descriptor.getRecentTransactions(account),
    hasTokens: descriptor.hasTokens,
    tokens: descriptor.hasTokens ? descriptor.getTokens(account) : [],
  };
}
