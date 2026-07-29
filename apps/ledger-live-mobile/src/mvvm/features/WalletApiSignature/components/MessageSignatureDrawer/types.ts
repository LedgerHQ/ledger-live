import type { Account, AccountLike, AnyMessage } from "@ledgerhq/types-live";

/**
 * A pending wallet-api `message.sign` request, surfaced to the webview so the
 * Device Intent Executor can be mounted as a bottom-sheet drawer over the live app
 * (instead of pushing a dedicated navigation screen).
 */
export type WalletApiDeviceIntentSignMessageRequest = {
  account: AccountLike;
  parentAccount: Account | undefined;
  message: AnyMessage;
  appName?: string;
  dependencies?: string[];
  /** Calling live-app manifest id, forwarded to deviceUxV2 analytics. */
  manifestId: string;
  /** Calling live-app manifest name, forwarded to deviceUxV2 analytics. */
  manifestName: string;
  onSuccess: (signature: string) => void;
  onError: (error: Error) => void;
  onCancel: () => void;
};
