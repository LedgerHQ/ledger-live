import type { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";

/**
 * A pending wallet-api `transaction.signRaw` request (also used by `bitcoin.signPsbt`),
 * surfaced to the webview so the Device Intent Executor is mounted as a bottom-sheet drawer
 * over the live app instead of the SignRawTransaction stack.
 */
export type WalletApiDeviceIntentSignRawRequest = {
  account: AccountLike;
  parentAccount: Account | undefined;
  /** Raw transaction passed as is to the bridge (e.g. a PSBT for Bitcoin). */
  transaction: string;
  /** Whether Ledger Wallet broadcasts the signed transaction: Bitcoin then finalizes the PSBT. */
  broadcast?: boolean;
  appName?: string;
  dependencies?: string[];
  /** Calling live-app manifest id, forwarded to deviceUxV2 analytics. */
  manifestId: string;
  /** Calling live-app manifest name, forwarded to deviceUxV2 analytics. */
  manifestName: string;
  onSuccess: (signedOperation: SignedOperation) => void;
  onError: (error: Error) => void;
};
