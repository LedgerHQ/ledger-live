import { ScreenName } from "~/const";
import type {
  DefaultAccountSwapParamList,
  DetailsSwapParamList,
  SwapPendingOperation,
  SwapSelectCurrency,
} from "../../../screens/Swap/types";

export type SwapFormNavigatorParamList = {
  [ScreenName.SwapForm]:
    | DetailsSwapParamList
    | DefaultAccountSwapParamList
    | SwapSelectCurrency
    | SwapPendingOperation;
  [ScreenName.SwapHistory]: undefined;
  [ScreenName.SwapLiveApp]: undefined;
};
