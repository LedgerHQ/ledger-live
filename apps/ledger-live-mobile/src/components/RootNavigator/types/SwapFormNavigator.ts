import { ScreenName } from "~/const";
import type {
  DetailsSwapParamList,
  DefaultAccountSwapParamList,
  SwapSelectCurrency,
  SwapPendingOperation,
} from "../../../screens/Swap/types";

export type SwapFormNavigatorParamList = {
  [ScreenName.SwapForm]:
    | DetailsSwapParamList
    | DefaultAccountSwapParamList
    | SwapSelectCurrency
    | SwapPendingOperation;
  [ScreenName.SwapHistory]: undefined;
};
