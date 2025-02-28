import { AccountLike } from "@ledgerhq/types-live";
import { Dispatch } from "redux";

import { getFee } from "./getFee";
import { getTransactionByHash } from "./getTransactionByHash";
import { saveSwapToHistory } from "./saveSwapToHistory";
import { swapRedirectToHistory } from "./swapRedirectToHistory";

import { NavigationProp, NavigationState } from "@react-navigation/native";

export const swapCustomHandlers = ({
  accounts,
  dispatch,
  navigation,
}: {
  accounts: AccountLike[];
  dispatch: Dispatch;
  navigation: Omit<NavigationProp<ReactNavigation.RootParamList>, "getState"> & {
    getState(): NavigationState | undefined;
  };
}) => ({
  "custom.getFee": getFee(accounts),
  "custom.getTransactionByHash": getTransactionByHash(accounts),
  "custom.saveSwapToHistory": saveSwapToHistory(accounts, dispatch),
  "custom.swapRedirectToHistory": swapRedirectToHistory(navigation),
});
