import type { Account, AccountLike, AnyMessage } from "@ledgerhq/types-live";

export type WalletApiDeviceIntentSignMessageRequest = Readonly<{
  account: AccountLike;
  parentAccount: Account | undefined;
  message: AnyMessage;
  appName?: string;
  dependencies?: string[];
  manifestId: string;
  manifestName: string;
  onSuccess: (signature: string) => void;
  onError: (error: Error) => void;
  onCancel: () => void;
}>;
