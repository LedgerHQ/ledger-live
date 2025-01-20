import { AccountLike } from "@ledgerhq/types-live";
import { Dispatch } from "redux";

import { getFee } from "./getFee";
import { getTransactionByHash } from "./getTransactionByHash";
import { saveSwapToHistory } from "./saveSwapToHistory";
import { swapRedirectToHistory } from "./swapRedirectToHistory";
import { NavigationProp, NavigationState } from "@react-navigation/core";
import { BaseComposite, StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";
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