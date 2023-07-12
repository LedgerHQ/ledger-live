import { ScreenName } from "../../../const";

export type EarnLiveAppNavigatorParamList = {
  [ScreenName.Earn]: {
    action?: "get-funds" | "stake" | "stake-account";
    currencyId?: string;
    platform?: string;
    accountId?: string;
  };
};
