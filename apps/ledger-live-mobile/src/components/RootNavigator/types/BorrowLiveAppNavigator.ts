import { ScreenName } from "~/const";

export type BorrowLiveAppNavigatorParamList = {
  [ScreenName.Borrow]: {
    action?: "go-back";
    intent?: "dashboard";
  };
};
