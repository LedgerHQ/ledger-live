import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";

export type ReceiveVerifyHintState = Readonly<{
  hasSeenReceiveVerifyHint: boolean;
}>;

export type ReceiveAddressDialogTarget = Readonly<{
  accountUUID: AccountUUID;
  assetId: CryptoOrTokenCurrencyId;
  source?: string;
}>;

export type ReceiveAddressDialogState = Readonly<{
  target: ReceiveAddressDialogTarget | null;
}>;
