import { AccountLike } from "@ledgerhq/types-live";
import { Dispatch } from "redux";

import { NavigationProp, NavigationState } from "@react-navigation/core";
import { getFee } from "./getFee";
import { getTransactionByHash } from "./getTransactionByHash";
import { saveSwapToHistory } from "./saveSwapToHistory";
import Config from "react-native-config";
import { sendSwapLiveAppReady } from "../../../../../e2e/bridge/client";

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
  "custom.saveSwapToHistory": saveSwapToHistory(accounts, dispatch, navigation),
  "custom.swapRedirectToHistory": () => null,
  "custom.isReady": async () => {
    if (Config.DETOX) {
      sendSwapLiveAppReady();
    }
  },
});
