import { SwapLiveError } from "@ledgerhq/live-common/exchange/swap/types";
import { ScreenName } from "~/const";

export type CustomErrorNavigatorParamList = {
  [ScreenName.CustomErrorScreen]: {
    error?: SwapLiveError | Error;
  };
};
