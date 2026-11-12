import type { AccountDescriptor, AccountUUID } from "@domain/entity-account-descriptor";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";

export type ReceiveTarget = Readonly<{
  accountUUID: AccountUUID;
  descriptor: AccountDescriptor;
  assetId: CryptoOrTokenCurrencyId;
}>;
