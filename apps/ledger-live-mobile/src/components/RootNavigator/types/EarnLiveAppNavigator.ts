import { ScreenName } from "~/const";

export type EarnLiveAppNavigatorParamList = {
  [ScreenName.Earn]: {
    action?: "get-funds" | "stake" | "stake-account" | "info-modal";
    currencyId?: string;
    platform?: string;
    accountId?: string;
    message?: string;
    messageTitle?: string;
  };
};
