import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type DeviceSelectionNavigatorParamsList = {
  [ScreenName.ConnectDevice]: {
    account?: AccountLike;
    accountId: string;
    parentId?: string;
    notSkippable?: boolean;
    title?: string;
    appName?: string;
    onSuccess?: () => void;
    onError?: () => void;
  };
  [ScreenName.SelectDevice]: {
    accountId?: string;
    parentId?: string;
    currency: CryptoCurrency;
    inline?: boolean;
    analyticsPropertyFlow?: string;
    createTokenAccount?: boolean;
  };
};
