import { SwapLiveError } from "@ledgerhq/live-common/exchange/swap/types";
import { ScreenName } from "~/const";

export type SwapCustomErrorNavigatorParamList = {
  [ScreenName.SwapCustomErrorScreen]: {
    error?: SwapLiveError | Error;
  };
};
