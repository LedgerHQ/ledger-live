import { ScreenName } from "~/const";

export type BorrowLiveAppNavigatorParamList = {
  [ScreenName.Borrow]: {
    accountId?: string;
    currencyId?: string;
    action?: "go-back";
    platform?: string;
  };
};
