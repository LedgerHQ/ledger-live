import {
  ParsedDeeplink,
  DeeplinkRoute,
  DeeplinkTrackingData,
  AccountsRoute,
  AccountRoute,
  AddAccountRoute,
  BuyRoute,
  EarnRoute,
  ManagerRoute,
  SwapRoute,
  BridgeRoute,
  SendRoute,
  ReceiveRoute,
  DelegateRoute,
  SettingsRoute,
  CardRoute,
  DiscoverRoute,
  WalletConnectRoute,
  MarketRoute,
  AssetRoute,
  RecoverRoute,
  RecoverRestoreFlowRoute,
  PostOnboardingRoute,
  LedgerSyncRoute,
  DefaultRoute,
} from "./types";

export function parseDeepLink(deeplink: string): ParsedDeeplink {
  const urlObj = new URL(deeplink);
  const { pathname, searchParams, search } = urlObj;
  /**
   * TODO: handle duplicated query params
   * Today, it only keeps one (the last) key / value pair encountered in search params
   * There is a loss of information
   * Example: http://localhost:5000/?weiAmount=0&foo=bar&abc=xyz&abc=123&theme=test
   * will result in a "query" object with the following structure:
   * {
   *  "weiAmount": "0",
   *  "foo": "bar",
   *  "abc": "123",
   *  "theme": "test"
   * }
   * instead of the following structure:
   * {
   *  "weiAmount": "0",
   *  "foo": "bar",
   *  "abc": ['xyz', '123'],
   *  "theme": "test"
   * }
   *
   * We could probably use https://github.com/ljharb/qs instead of URL and
   * Object.fromEntries(searchParams) because we would have to use
   * searchParams.getAll("abc") to get the array from the searchParams with
   * what we have now
   */
  const query = Object.fromEntries(searchParams);

  // With new Chrome behavior: host contains the main URL part, pathname contains the path
  // ledgerwallet://settings/about -> host: "settings", pathname: "/about"
  const url = urlObj.host;
  const path = pathname.replace(/(^\/+|\/+$)/g, "");
  const tracking = extractTrackingData(query, url);

  return {
    url,
    path,
    query,
    search,
    tracking,
  };
}

function extractTrackingData(query: Record<string, string>, url: string): DeeplinkTrackingData {
  return {
    ajsPropSource: query.ajs_prop_source,
    ajsPropCampaign: query.ajs_prop_campaign,
    ajsPropTrackData: query.ajs_prop_track_data,
    currency: query.currency,
    installApp: query.installApp,
    appName: query.appName,
    deeplinkSource: query.deeplinkSource,
    deeplinkType: query.deeplinkType,
    deeplinkDestination: query.deeplinkDestination,
    deeplinkChannel: query.deeplinkChannel,
    deeplinkMedium: query.deeplinkMedium,
    deeplinkCampaign: query.deeplinkCampaign,
    deeplinkLocation: query.deeplinkLocation,
    url,
  };
}

export function createRoute(parsed: ParsedDeeplink): DeeplinkRoute {
  const { url, path, query, search } = parsed;

  switch (url) {
    case "accounts": {
      const route: AccountsRoute = {
        type: "accounts",
        address: query.address,
      };
      return route;
    }

    case "account": {
      const route: AccountRoute = {
        type: "account",
        currency: query.currency,
        address: query.address,
      };
      return route;
    }

    case "add-account": {
      const route: AddAccountRoute = {
        type: "add-account",
        currency: query.currency,
      };
      return route;
    }

    case "buy": {
      const route: BuyRoute = {
        type: "buy",
        search,
      };
      return route;
    }

    case "earn": {
      const route: EarnRoute = {
        type: "earn",
        path,
        cryptoAssetId: query.cryptoAssetId,
        accountId: query.accountId,
        search,
      };
      return route;
    }

    case "myledger": {
      const route: ManagerRoute = {
        type: "myledger",
        installApp: query.installApp,
      };
      return route;
    }

    case "swap": {
      const route: SwapRoute = {
        type: "swap",
        amountFrom: query.amountFrom,
        fromToken: query.fromToken,
        toToken: query.toToken,
        affiliate: query.affiliate,
      };
      return route;
    }

    case "bridge": {
      const route: BridgeRoute = {
        type: "bridge",
        origin: query.origin,
        appName: query.appName,
      };
      return route;
    }

    case "send": {
      const route: SendRoute = {
        type: "send",
        currency: query.currency,
        recipient: query.recipient,
        amount: query.amount,
      };
      return route;
    }

    case "receive": {
      const route: ReceiveRoute = {
        type: "receive",
        currency: query.currency,
        recipient: query.recipient,
        amount: query.amount,
      };
      return route;
    }

    case "delegate": {
      const route: DelegateRoute = {
        type: "delegate",
        currency: query.currency,
        recipient: query.recipient,
        amount: query.amount,
      };
      return route;
    }

    case "settings": {
      const route: SettingsRoute = {
        type: "settings",
        path,
      };
      return route;
    }

    case "card": {
      const route: CardRoute = {
        type: "card",
        query,
      };
      return route;
    }

    case "discover": {
      const route: DiscoverRoute = {
        type: "discover",
        path,
        query,
        search,
      };
      return route;
    }

    case "wc": {
      const route: WalletConnectRoute = {
        type: "wc",
        uri: query.uri,
        query,
      };
      return route;
    }

    case "market": {
      const route: MarketRoute = {
        type: "market",
        path,
      };
      return route;
    }

    case "asset": {
      const route: AssetRoute = {
        type: "asset",
        path,
      };
      return route;
    }

    case "recover": {
      const route: RecoverRoute = {
        type: "recover",
        path,
        search,
      };
      return route;
    }

    case "recover-restore-flow": {
      const route: RecoverRestoreFlowRoute = {
        type: "recover-restore-flow",
      };
      return route;
    }

    case "post-onboarding": {
      const route: PostOnboardingRoute = {
        type: "post-onboarding",
        device: query.device,
      };
      return route;
    }

    case "ledgersync": {
      const route: LedgerSyncRoute = {
        type: "ledgersync",
      };
      return route;
    }

    default: {
      const route: DefaultRoute = {
        type: "default",
      };
      return route;
    }
  }
}
