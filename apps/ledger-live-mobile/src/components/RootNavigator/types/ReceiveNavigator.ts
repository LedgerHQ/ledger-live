import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import type { ScreenName } from "~/const";
import type { AccountUUID } from "@domain/entity-account";

/** The new receive flow (`newReceiveFlow`). */
export type ReceiveNavigatorParamList = {
  [ScreenName.ReceiveAddress]: {
    accountUUID: AccountUUID;
    assetId: CryptoOrTokenCurrencyId;
  };
};
