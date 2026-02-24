import { NavigatorName, ScreenName } from "~/const";

/**
 * Handles deeplinks that require different navigation state in Wallet 4.0.
 *
 * In Wallet 4.0 (shouldDisplayWallet40MainNav ON), Discover and MyLedger are no longer
 * bottom tabs — they are full-screen stack screens pushed from the BaseNavigator,
 * accessible via the TopBar buttons.
 *
 * The static linking config maps these paths under NavigatorName.Main (the tab navigator),
 * which does NOT include Discover or MyLedger in Wallet40TabNavigator. This function
 * intercepts those paths and returns the correct navigation state targeting the
 * BaseNavigator-level screens.
 *
 * @param hostname - The deeplink hostname ("discover" or "myledger")
 * @param platform - The platform segment from the path (only relevant for discover/:platform)
 * @param query - Parsed query parameters from the URL
 * @returns Navigation state for the correct W40 screen, or undefined if not handled
 */
export function handleWallet40Deeplink(
  hostname: string,
  platform: string,
  query: Record<string, string>,
): ReturnType<typeof import("@react-navigation/native").getStateFromPath> | undefined {
  if (hostname === "discover" && !platform) {
    return {
      routes: [
        {
          name: NavigatorName.Base,
          state: {
            index: 1,
            routes: [
              { name: NavigatorName.Main },
              {
                name: NavigatorName.Discover,
                state: {
                  routes: [{ name: ScreenName.DiscoverScreen }],
                },
              },
            ],
          },
        },
      ],
    };
  }

  if (hostname === "myledger") {
    return {
      routes: [
        {
          name: NavigatorName.Base,
          state: {
            index: 1,
            routes: [
              { name: NavigatorName.Main },
              {
                name: NavigatorName.MyLedger,
                state: {
                  routes: [
                    {
                      name: ScreenName.MyLedgerChooseDevice,
                      params: {
                        searchQuery: query.searchQuery,
                        installApp: query.installApp,
                      },
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

  return undefined;
}
