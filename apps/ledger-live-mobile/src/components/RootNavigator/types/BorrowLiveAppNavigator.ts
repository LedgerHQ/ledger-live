import { ScreenName } from "~/const";

export type BorrowLiveAppNavigatorParamList = {
  [ScreenName.Borrow]: {
    intent?: "dashboard" | "deposit" | "withdraw";
  };
};
