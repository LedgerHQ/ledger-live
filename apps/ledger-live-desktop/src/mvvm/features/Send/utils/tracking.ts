import type { AccountLike } from "@ledgerhq/types-live";

type SendFlowTrackingAccount = Readonly<{
  type?: AccountLike["type"];
  currency?: Readonly<{ id?: string }>;
  token?: Readonly<{ parentCurrency: Readonly<{ id: string }> }>;
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
    return parentAccount?.currency.id ?? account.token?.parentCurrency.id ?? "";
  }

  return account.currency?.id ?? "";
}

export function getSendFlowTrackingProperties(
  account: SendFlowTrackingAccount | null,
  parentAccount?: SendFlowTrackingParentAccount | null,
) {
  return {
    flow: "send",
    blockchain: getSendFlowBlockchain(account, parentAccount),
  };
}
