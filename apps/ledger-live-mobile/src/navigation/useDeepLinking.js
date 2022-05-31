// @flow
import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/lib/platform/providers/RemoteLiveAppProvider";
import { filterPlatformApps } from "@ledgerhq/live-common/lib/platform/PlatformAppProvider/helpers";
import { NavigatorName, ScreenName } from "../const";

function getSettingsScreen(pathname) {
  const secondPath = pathname.replace(/(^\/+|\/+$)/g, "");

  let screen;
  switch (secondPath) {
    case "general":
      screen = ScreenName.GeneralSettings;
      break;
    case "accounts":
      screen = ScreenName.AccountsSettings;
      break;
    case "about":
      screen = ScreenName.AboutSettings;
      break;
    case "help":
      screen = ScreenName.HelpSettings;
      break;
    case "experimental":
      screen = ScreenName.ExperimentalSettings;
      break;
    case "developer":
      screen = ScreenName.DeveloperSettings;
      break;
    default:
      screen = ScreenName.SettingsScreen;
  }
  return screen;
}

// To avoid recreating a ref on each render and triggering hooks
const emptyObject = {};

export function useDeepLinkHandler() {
  const { navigate } = useNavigation();
  const { state } = useRemoteLiveAppContext();
  const manifests = state?.value?.liveAppByIndex || emptyObject;

  const filteredManifests = useMemo(() => {
    const branches = ["stable", "soon"];

    return filterPlatformApps(Array.from(manifests.values()), {
      version: "0.0.1",
      platform: "mobile",
      branches,
    });
  }, [manifests]);

  const handler = useCallback(
    (deeplink: string) => {
      const { hostname, searchParams, pathname = "" } = new URL(deeplink);
      const query = Object.fromEntries(searchParams);
      const { currency } = query;
      const path = pathname.replace(/(^\/+|\/+$)/g, "");

      switch (hostname) {
        case "accounts":
          navigate(NavigatorName.Accounts);
          break;

        case "buy": {
          const buyCurrency = pathname.replace(/(^\/+|\/+$)/g, "");
          if (buyCurrency)
            navigate(NavigatorName.Exchange, {
              screen: ScreenName.ExchangeBuy,
              params: { currency: buyCurrency },
            });
          else navigate(NavigatorName.Exchange);
          break;
        }

        case "swap":
          navigate(NavigatorName.Swap);
          break;

        case "account":
          navigate(NavigatorName.Accounts, {
            screen: ScreenName.Accounts,
            params: { currency },
          });
          break;

        case "receive":
          navigate(NavigatorName.ReceiveFunds, {
            screen: ScreenName.ReceiveSelectAccount,
            params: { currency },
          });
          break;
        case "send":
          navigate(NavigatorName.SendFunds, {
            screen: ScreenName.SendCoin,
            params: { currency },
          });
          break;

        case "settings":
          navigate(NavigatorName.Settings, {
            screen: getSettingsScreen(pathname),
          });
          break;

        case "discover": {
          const dapp =
            path && filteredManifests.find(m => path.toLowerCase() === m.id);

          navigate(NavigatorName.Discover, {
            screen: ScreenName.PlatformCatalog,
            params: dapp
              ? {
                  platform: dapp.id,
                  name: dapp.name,
                  // $FlowFixMe Nope I want query to be spread last. Sry Flow.
                  ...query,
                }
              : query,
          });

          break;
        }

        case "manager": {
          navigate(NavigatorName.Manager, {
            screen: ScreenName.Manager,
            params: query,
          });
          break;
        }

        case "portfolio":
        default:
          navigate(NavigatorName.Main, { screen: ScreenName.Portfolio });
          break;
      }
    },
    [navigate, filteredManifests],
  );

  return {
    handler,
  };
}
