import { CARD_APP_ID, WC_ID } from "@ledgerhq/live-common/wallet-api/constants";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { DeeplinkHandler } from "../types";

export const cardHandler: DeeplinkHandler<"card"> = (route, { navigate }) => {
  navigate("/card", route.query);
};

export const discoverHandler: DeeplinkHandler<"discover"> = (route, { navigate }) => {
  const { path, query, search } = route;

  if (path?.startsWith("protect")) {
    navigate(`/recover/${path}`, undefined, search);
    return;
  }

  if (path === CARD_APP_ID) {
    navigate("/card", query);
    return;
  }

  navigate(`/platform/${path ?? ""}`, query);
};

export const walletConnectHandler: DeeplinkHandler<"wc"> = (
  route,
  { navigate, currentPathname },
) => {
  const { uri, query } = route;
  const wcPathname = `/platform/${WC_ID}`;

  // Only prevent requests if already on the wallet connect live-app
  if (currentPathname === wcPathname) {
    try {
      // Prevent a request from updating the live-app url and reloading it
      if (!uri || new URL(uri).searchParams.get("requestId")) {
        return;
      }
    } catch {
      // Fall back on navigation to the live-app in case of an invalid URL
    }
  }

  setTrackingSource("deeplink");
  navigate(wcPathname, query);
};
