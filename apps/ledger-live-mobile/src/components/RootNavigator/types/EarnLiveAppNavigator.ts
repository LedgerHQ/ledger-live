import { ScreenName } from "~/const";

export type EarnLiveAppNavigatorParamList = {
  [ScreenName.Earn]: {
    accountId?: string;
    action?: "get-funds" | "stake" | "stake-account" | "info-modal";
    currencyId?: string;
    learnMore?: string;
    message?: string;
    messageTitle?: string;
    platform?: string;
  };
};
