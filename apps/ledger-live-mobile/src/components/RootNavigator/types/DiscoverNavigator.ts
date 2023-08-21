import { Account, AccountLike } from "@ledgerhq/types-live";
import { ScreenName } from "../../../const";

export type DiscoverNavigatorStackParamList = {
  [ScreenName.DiscoverScreen]: undefined;
  [ScreenName.PlatformCatalog]:
    | {
        defaultAccount?: AccountLike | null;
        defaultParentAccount?: Account | null;
        platform?: string;
      }
    | undefined;
};
