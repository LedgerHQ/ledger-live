import type { SwapLiveError } from "@ledgerhq/live-common/exchange/swap/types";
import { ScreenName } from "~/const";
import type {
  SwapHistoryParams,
  SwapOperationDetails,
  SwapPendingOperation,
} from "~/screens/Swap/types";

export type SwapSubScreensNavigatorParamList = {
  [ScreenName.SwapPendingOperation]: SwapPendingOperation;
  [ScreenName.SwapHistory]: SwapHistoryParams | undefined;
  [ScreenName.SwapLoading]: undefined;
  [ScreenName.SwapCustomError]: { error: SwapLiveError | Error };
  [ScreenName.SwapOperationDetails]: {
    swapOperation: SwapOperationDetails;
    fromPendingOperation?: true;
  };
};
