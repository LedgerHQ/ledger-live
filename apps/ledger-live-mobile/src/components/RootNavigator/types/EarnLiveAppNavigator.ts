import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ScreenName } from "~/const";

export type EarnLiveAppNavigatorParamList = {
  [ScreenName.Earn]: {
    accountId?: string;
    action?: "get-funds" | "stake" | "stake-account" | "info-modal" | "menu-modal" | "go-back";
    currencyId?: string;
    learnMore?: string;
    message?: string;
    messageTitle?: string;
    platform?: string;
    intent?: "deposit" | "withdraw";
    cryptoAssetId?: TokenCurrency["id"]; // Only for deposit/withdraw flows
  };
};
