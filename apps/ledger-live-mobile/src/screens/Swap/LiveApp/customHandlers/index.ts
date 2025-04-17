import { AccountLike } from "@ledgerhq/types-live";
import { Dispatch } from "redux";

import { NavigationProp, NavigationState } from "@react-navigation/core";
import { getFee } from "./getFee";
import { getTransactionByHash } from "./getTransactionByHash";
import { saveSwapToHistoryFn } from "./saveSwapToHistory";

export type NavigationType = Omit<NavigationProp<ReactNavigation.RootParamList>, "getState"> & {
  getState(): NavigationState | undefined;
};

export const swapCustomHandlers = ({
  accounts,
  dispatch,
  navigation,
}: {
  accounts: AccountLike[];
  dispatch: Dispatch;
  navigation: NavigationType;
}) => ({
  "custom.getFee": getFee(accounts, navigation),
  "custom.getTransactionByHash": getTransactionByHash(accounts),
  "custom.saveSwapToHistory": saveSwapToHistoryFn(accounts, dispatch, navigation),
  "custom.swapRedirectToHistory": () => null,
});
