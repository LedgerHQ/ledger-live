import { ScreenName } from "~/const";

export type EarnLiveAppNavigatorParamList = {
  [ScreenName.Earn]: {
    partnerCoins: number;
    accountId?: string;
    action?: "get-funds" | "stake" | "stake-account" | "info-modal" | "menu-modal";
    currencyId?: string;
    learnMore?: string;
    message?: string;
    messageTitle?: string;
    platform?: string;
  };
};
