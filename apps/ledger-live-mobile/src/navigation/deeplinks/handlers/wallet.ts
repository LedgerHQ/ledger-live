import { getStateFromPath } from "@react-navigation/native";
import { isValidInstallApp } from "LLM/features/DeeplinkInstallApp";
import { openDeeplinkInstallAppDrawer } from "~/actions/deeplinkInstallApp";
import type { DeeplinkHandler } from "../types";

/**
 * Handles `ledgerlive://wallet` and `ledgerlive://portfolio`
 *
 * When the `installApp` param is present and valid, opens the install-app drawer
 * then navigates to portfolio. Otherwise falls through to default routing.
 */
export const walletHandler: DeeplinkHandler = ({ query, rawPath }, { dispatch, config }) => {
  const { installApp } = query;

  if (installApp && isValidInstallApp(installApp)) {
    dispatch(openDeeplinkInstallAppDrawer({ appToInstall: installApp }));
    return getStateFromPath("portfolio", config);
  }

  return getStateFromPath(rawPath, config);
};
