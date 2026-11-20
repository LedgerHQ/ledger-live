import type { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";

export type SignTransactionIntentComponentExtraProps = Readonly<{
  manifestId: string;
  manifestName?: string;
  recipient?: string;
}>;

export type WalletApiDeviceIntentSignRequest = Readonly<{
  account: AccountLike;
  parentAccount: Account | undefined;
  transaction: Transaction;
  appName?: string;
  dependencies?: string[];
  manifestId: string;
  manifestName: string;
  onSuccess: (signedOperation: SignedOperation) => void;
  onError: (error: Error) => void;
}>;
