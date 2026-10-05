import type { AccountLike } from "@ledgerhq/types-live";
import type { SendFlowStep } from "@ledgerhq/live-common/flows/send/types";

type SendFlowTrackingAccount = Readonly<{
  type?: AccountLike["type"];
  currency?: Readonly<{ id?: string; ticker?: string }>;
  token?: Readonly<{
    id?: string;
    ticker?: string;
    parentCurrencyId: string;
  }>;
}>;

type SendFlowTrackingParentAccount = Readonly<{
  currency: Readonly<{ id: string }>;
}>;

export type SendFlowTrackedMessage = Readonly<{
  messageId: string;
  messageType: "error" | "warning";
  suppressedErrors?: readonly string[];
}>;

export type SendFlowMessageMetadata = Readonly<{
  recipientType?: string | null;
  recipientLength?: number | null;
  memoLength?: number | null;
  memoType?: string | null;
  amountRatioToBalance?: number | null;
}>;

type SendFlowErrorTrackingPropertiesParams = Readonly<{
  account: SendFlowTrackingAccount | null;
  parentAccount?: SendFlowTrackingParentAccount | null;
  flowSessionId: string;
  step: SendFlowStep;
  message: SendFlowTrackedMessage;
  metadata?: SendFlowMessageMetadata;
}>;

export function getSendFlowBlockchain(
  account: SendFlowTrackingAccount | null,
  parentAccount?: SendFlowTrackingParentAccount | null,
): string {
  if (!account) return "";

  if (account.type === "TokenAccount") {
    return parentAccount?.currency?.id ?? account.token?.parentCurrencyId ?? "";
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
  source?: string,
) {
  return {
    flow: "send",
    newSendFlow,
    blockchain: getSendFlowBlockchain(account, parentAccount),
    currency: getSendFlowCurrencyTicker(account),
    currency_id: getSendFlowCurrencyId(account),
    ...(source ? { source } : {}),
  };
}

export function getSendFlowErrorTrackingProperties({
  account,
  parentAccount,
  flowSessionId,
  step,
  message,
  metadata,
}: SendFlowErrorTrackingPropertiesParams) {
  return {
    ...getSendFlowTrackingProperties(account, parentAccount),
    flow_session_id: flowSessionId,
    step,
    message_id: message.messageId,
    message_type: message.messageType,
    suppressed_errors: [...(message.suppressedErrors ?? [])],
    ...(metadata?.recipientType != null ? { recipient_type: metadata.recipientType } : {}),
    ...(metadata?.recipientLength != null ? { recipient_length: metadata.recipientLength } : {}),
    ...(metadata?.memoLength != null ? { memo_length: metadata.memoLength } : {}),
    ...(metadata?.memoType != null ? { memo_type: metadata.memoType } : {}),
    ...(metadata?.amountRatioToBalance != null
      ? { amount_ratio_to_balance: metadata.amountRatioToBalance }
      : {}),
  };
}

export function getActiveWarningsTrackingProperties(activeWarnings: readonly string[]) {
  return {
    active_warnings: [...activeWarnings],
    active_warnings_count: activeWarnings.length,
  };
}
