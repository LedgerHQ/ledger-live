// @flow
import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
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
    default:
      screen = ScreenName.Settings;
  }
  return screen;
}

export function useDeepLinkHandler() {
  const { navigate } = useNavigation();

  const handler = useCallback(
    (deeplink: string) => {
      const { hostname, searchParams, pathname = "" } = new URL(deeplink);
      const query = Object.fromEntries(searchParams);
      const { currency } = query;

      switch (hostname) {
        case "accounts":
          navigate(NavigatorName.Accounts);
          break;

        case "buy": {
          const buyCurrency = pathname.replace(/(^\/+|\/+$)/g, "");
          if (buyCurrency)
            navigate(NavigatorName.ExchangeBuyFlow, {
              screen: ScreenName.ExchangeSelectCurrency,
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
            screen: ScreenName.SendFundsMain,
            params: { currency },
          });
          break;

        case "settings":
          navigate(NavigatorName.Settings, {
            screen: getSettingsScreen(pathname),
          });
          break;

        case "portfolio":
        default:
          navigate(NavigatorName.Main, { screen: ScreenName.Portfolio });
          break;
      }
    },
    [navigate],
  );

  return {
    handler,
  };
}
