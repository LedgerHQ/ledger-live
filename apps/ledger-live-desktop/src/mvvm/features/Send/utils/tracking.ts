import type { AccountLike } from "@ledgerhq/types-live";

type SendFlowTrackingAccount = Readonly<{
  type?: AccountLike["type"];
  currency?: Readonly<{ id?: string; ticker?: string }>;
  token?: Readonly<{
    id?: string;
    ticker?: string;
    parentCurrency: Readonly<{ id: string }>;
  }>;
}>;

type SendFlowTrackingParentAccount = Readonly<{
  currency: Readonly<{ id: string }>;
}>;

export function getSendFlowBlockchain(
  account: SendFlowTrackingAccount | null,
  parentAccount?: SendFlowTrackingParentAccount | null,
): string {
  if (!account) return "";

  if (account.type === "TokenAccount") {
    return parentAccount?.currency?.id ?? account.token?.parentCurrency?.id ?? "";
  }

  return account.currency?.id ?? "";
}

export function getSendFlowCurrencyId(account: SendFlowTrackingAccount | null): string {
  if (!account) return "";

  if (account.type === "TokenAccount") {
    return account.token?.id ?? "";
  }

  return account.currency?.id ?? "";
}

export function getSendFlowCurrencyTicker(account: SendFlowTrackingAccount | null): string {
  if (!account) return "";

  if (account.type === "TokenAccount") {
    return account.token?.ticker ?? "";
  }

  return account.currency?.ticker ?? "";
}

export function getSendFlowTrackingProperties(
  account: SendFlowTrackingAccount | null,
  parentAccount?: SendFlowTrackingParentAccount | null,
  newSendFlow = true,
) {
  return {
    flow: "send",
    newSendFlow,
    blockchain: getSendFlowBlockchain(account, parentAccount),
    currency: getSendFlowCurrencyTicker(account),
    currency_id: getSendFlowCurrencyId(account),
  };
}
