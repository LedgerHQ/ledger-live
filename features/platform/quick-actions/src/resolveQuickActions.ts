import type {
  CurrencyQuickActionsInputs,
  QuickAction,
  QuickActionId,
  QuickActionsInputs,
  WalletQuickActionsInputs,
} from "./types";

const active = (id: QuickActionId): QuickAction => ({ id, state: "active" });

const activeIf = (id: QuickActionId, isActive: boolean): QuickAction => ({
  id,
  state: isActive ? "active" : "inactive",
});

const NO_SIGNER_ACTIONS: readonly QuickAction[] = [active("connect"), active("buyLedger")];

function resolveWalletActions({
  platform,
  hasSigner,
  hasFunds,
  isExchangeEnabled,
}: WalletQuickActionsInputs): readonly QuickAction[] {
  if (!hasSigner) return NO_SIGNER_ACTIONS;

  if (platform === "mobile") {
    return [
      active("transfer"),
      activeIf("swap", isExchangeEnabled),
      activeIf("buy", isExchangeEnabled),
    ];
  }

  return [active("receive"), active("buy"), activeIf("sell", hasFunds), activeIf("send", hasFunds)];
}

function resolveDesktopCurrencyActions({
  isBuyAvailable,
  isSellAvailable,
  isEarnAvailable,
  hasFunds,
}: CurrencyQuickActionsInputs): readonly QuickAction[] {
  return [
    active("receive"),
    activeIf("send", hasFunds),
    ...(isBuyAvailable ? [active("buy")] : []),
    ...(isSellAvailable ? [activeIf("sell", hasFunds)] : []),
    ...(isEarnAvailable ? [activeIf("earn", hasFunds)] : []),
  ];
}

function resolveMobileCurrencyActions({
  isCurrencySupported,
  hasAccounts,
  hasFunds,
  isBuyAvailable,
  isSellAvailable,
  isSwapAvailable,
  isEarnAvailable,
}: CurrencyQuickActionsInputs): readonly QuickAction[] {
  const transfer = hasAccounts ? [active("transfer")] : [];
  if (!isCurrencySupported) return transfer;

  return [
    ...transfer,
    ...(isBuyAvailable ? [active("buy")] : []),
    ...(isSwapAvailable ? [active("swap")] : []),
    ...(isSellAvailable && hasFunds ? [active("sell")] : []),
    ...(isEarnAvailable ? [active("earn")] : []),
  ];
}

function resolveMobileAccountActions(inputs: CurrencyQuickActionsInputs): readonly QuickAction[] {
  if (inputs.hasFunds) return resolveMobileCurrencyActions(inputs);
  if (!inputs.isCurrencySupported) return [active("transfer")];
  return [active("transfer"), ...(inputs.isBuyAvailable ? [active("buy")] : [])];
}

function resolveCurrencyActions(inputs: CurrencyQuickActionsInputs): readonly QuickAction[] {
  if (inputs.platform === "mobile" && inputs.scope === "account") {
    return resolveMobileAccountActions(inputs);
  }
  if (inputs.platform === "mobile") return resolveMobileCurrencyActions(inputs);
  if (!inputs.isCurrencySupported) return [];
  return resolveDesktopCurrencyActions(inputs);
}

/**
 * Visible quick actions, in display order. A hidden action is absent; a shown but disabled one is "inactive".
 * Wallet and asset scopes reproduce the existing Portfolio and Asset Detail bars; the account scope applies
 * the asset rules to a single account (its funds, its currency), except on mobile where an account without funds keeps only Transfer and Buy.
 */
export function resolveQuickActions(inputs: QuickActionsInputs): readonly QuickAction[] {
  if (inputs.scope === "wallet") return resolveWalletActions(inputs);
  return resolveCurrencyActions(inputs);
}
