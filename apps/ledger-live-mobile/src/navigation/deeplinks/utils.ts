import { NavigationState, PartialState } from "@react-navigation/native";
import { BUY_SELL_UI_APP_ID } from "@ledgerhq/live-common/wallet-api/constants";

export function isWalletConnectUrl(url: string) {
  return url.startsWith("wc:");
}

export function isWalletConnectLink(url: string) {
  return (
    isWalletConnectUrl(url) ||
    url.startsWith("ledgerwallet://wc") ||
    url.startsWith("ledgerlive://wc") ||
    url.startsWith("https://ledger.com/wc")
  );
}

export function getProxyURL(url: string, customBuySellUiAppId?: string) {
  const uri = new URL(url);
  const { hostname, pathname } = uri;
  const platform = pathname.split("/")[1];

  if (hostname === "discover" && platform && platform.startsWith("protect")) {
    return url.replace("://discover", "://recover");
  }

  if (isWalletConnectUrl(url)) {
    return `ledgerlive://wc?uri=${encodeURIComponent(url)}`;
  }

  const buySellAppIds = customBuySellUiAppId
    ? [customBuySellUiAppId, BUY_SELL_UI_APP_ID]
    : [BUY_SELL_UI_APP_ID];

  // This is to handle links set in the useFromAmountStatusMessage in LLC.
  // Also handles a difference in paths between LLD on LLD /platform/:app_id
  // but on LLM /discover/:app_id
  if (hostname === "platform" && buySellAppIds.includes(platform)) {
    return url.replace("://platform", "://discover");
  }

  return url;
}

export function isScreenInState(
  screenName: string,
  state?: NavigationState | PartialState<NavigationState>,
): boolean {
  if (!state) {
    return false;
  }
  for (let i = 0; i < state.routes.length; i++) {
    if (state.routes[i].name === screenName) {
      return true;
    }
    if (state.routes[i].state && isScreenInState(screenName, state.routes[i].state)) {
      return true;
    }
  }
  return false;
}
