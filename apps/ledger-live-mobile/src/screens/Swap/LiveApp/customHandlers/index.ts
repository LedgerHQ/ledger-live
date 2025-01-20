import { AccountLike } from "@ledgerhq/types-live";
import { Dispatch } from "redux";

import { getFee } from "./getFee";
import { getTransactionByHash } from "./getTransactionByHash";
import { saveSwapToHistory } from "./saveSwapToHistory";
import { swapRedirectToHistory } from "./swapRedirectToHistory";

import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { SwapFormNavigatorParamList } from "~/components/RootNavigator/types/SwapFormNavigator";

export const swapCustomHandlers = ({
  accounts,
  dispatch,
  navigation,
}: {
  accounts: AccountLike[];
  dispatch: Dispatch;
  navigation: StackNavigatorNavigation<SwapFormNavigatorParamList>;
}) => ({
  "custom.getFee": getFee(accounts),
  "custom.getTransactionByHash": getTransactionByHash(accounts),
  "custom.saveSwapToHistory": saveSwapToHistory(accounts, dispatch),
  "custom.swapRedirectToHistory": swapRedirectToHistory(navigation),
});