export type QuickActionId =
  | "receive"
  | "send"
  | "transfer"
  | "buy"
  | "sell"
  | "swap"
  | "earn"
  | "connect"
  | "buyLedger";

export type QuickActionState = "active" | "inactive";

export type QuickAction = Readonly<{ id: QuickActionId; state: QuickActionState }>;

export type QuickActionsPlatform = "desktop" | "mobile";

export type WalletQuickActionsInputs = Readonly<{
  scope: "wallet";
  platform: QuickActionsPlatform;
  hasSigner: boolean;
  hasFunds: boolean;
  isExchangeEnabled: boolean;
}>;

export type CurrencyQuickActionsInputs = Readonly<{
  scope: "asset" | "account";
  platform: QuickActionsPlatform;
  isCurrencySupported: boolean;
  hasAccounts: boolean;
  hasFunds: boolean;
  isBuyAvailable: boolean;
  isSellAvailable: boolean;
  isSwapAvailable: boolean;
  isEarnAvailable: boolean;
}>;

export type QuickActionsInputs = WalletQuickActionsInputs | CurrencyQuickActionsInputs;
