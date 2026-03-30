import { getStateFromPath } from "@react-navigation/native";
import { handleWallet40Deeplink } from "../handleWallet40Deeplink";
import type { DeeplinkHandler } from "../types";

/**
 * Handles `ledgerlive://myledger`
 *
 * In Wallet 4.0 (shouldDisplayWallet40MainNav ON), MyLedger is no longer a bottom tab
 * and requires a different navigation state. Falls through to static config otherwise.
 */
export const myledgerHandler: DeeplinkHandler = (
  { platform, query, rawPath },
  { config, shouldDisplayWallet40MainNav },
) => {
  if (shouldDisplayWallet40MainNav) {
    return handleWallet40Deeplink("myledger", platform, query);
  }

  return getStateFromPath(rawPath, config);
};
