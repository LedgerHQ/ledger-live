import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";

/**
 * A pending wallet-api `transaction.sign` request, surfaced to the webview so the
 * Device Intent Executor can be mounted as a bottom-sheet drawer over the live app
 * (instead of pushing a dedicated navigation screen).
 */
export type WalletApiDeviceIntentSignRequest = {
  account: AccountLike;
  parentAccount: Account | undefined;
  transaction: Transaction;
  /** Whether the coin family lets the user edit the fees of this transaction. */
  canEditFees: boolean;
  /** Whether the live app sent its own fees, which are kept unless the user changes them. */
  hasFeesProvided: boolean;
  appName?: string;
  dependencies?: string[];
  /** Calling live-app manifest id, forwarded to deviceUxV2 analytics. */
  manifestId: string;
  /** Calling live-app manifest name, forwarded to deviceUxV2 analytics. */
  manifestName: string;
  onSuccess: (signedOperation: SignedOperation) => void;
  onError: (error: Error) => void;
};
