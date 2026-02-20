import { NavigatorName, ScreenName } from "~/const";

/**
 * Handles the `market` deeplink when the Market banner feature is active.
 *
 * When `shouldDisplayMarketBanner` is ON, the market deeplink without a currency
 * path should navigate directly to the MarketList screen via the BaseNavigator,
 * rather than going through the static linking config.
 *
 * @returns Navigation state targeting the MarketList screen
 */
export function handleMarketBannerDeeplink(): ReturnType<
  typeof import("@react-navigation/native").getStateFromPath
> {
  return {
    routes: [
      {
        name: NavigatorName.Base,
        state: {
          index: 1,
          routes: [{ name: NavigatorName.Main }, { name: ScreenName.MarketList }],
        },
      },
    ],
  };
}
