import { getFocusedRouteNameFromRoute, type Route } from "@react-navigation/native";
import { ScreenName } from "~/const";

// Nested Pay screens that hide the Wallet 4.0 tab header.
const PAY_TAB_FULL_SCREEN_ROUTES = new Set<string>([
  ScreenName.PayTabRequestReceive,
  ScreenName.PayTabSelectContact,
]);

export function getPayTabScreenOptions({ route }: { route: Route<string> }) {
  const focusedRoute = getFocusedRouteNameFromRoute(route) ?? ScreenName.PayTab;
  return {
    headerShown: !PAY_TAB_FULL_SCREEN_ROUTES.has(focusedRoute),
  };
}
