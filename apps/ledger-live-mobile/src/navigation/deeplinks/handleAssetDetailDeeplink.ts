import { NavigatorName, ScreenName } from "~/const";

export type AssetDetailDeeplinkSource = "deeplink_asset" | "deeplink_market";

/**
 * Handles `asset` / `market` deeplinks when the aggregated Asset Detail (Wallet 4.0) flow is ON.
 *
 * Builds a navigation state that pushes the new `AssetDetail` screen on top of `Main`, so that
 * back navigation returns to the portfolio instead of exiting the app — matching
 * `handleMarketBannerDeeplink` and `handleWallet40Deeplink`.
 *
 * The `source` route param flows into `useAssetDetailViewModel` and is forwarded by
 * `AssetDetailView`'s `TrackScreen` to the screen-view event properties.
 *
 * @param currencyId - Validated Ledger crypto asset id (e.g. "bitcoin").
 * @param source - Origin of the deeplink ("deeplink_asset" or "deeplink_market"), used for tracking.
 * @returns Navigation state targeting `Base > AssetDetail > AssetDetail` with `Main` at index 0.
 */
export function handleAssetDetailDeeplink({
  currencyId,
  source,
}: {
  currencyId: string;
  source: AssetDetailDeeplinkSource;
}): ReturnType<typeof import("@react-navigation/native").getStateFromPath> {
  return {
    routes: [
      {
        name: NavigatorName.Base,
        state: {
          index: 1,
          routes: [
            { name: NavigatorName.Main },
            {
              name: NavigatorName.AssetDetail,
              state: {
                routes: [
                  {
                    name: ScreenName.AssetDetail,
                    params: { currencyId, source },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  };
}
