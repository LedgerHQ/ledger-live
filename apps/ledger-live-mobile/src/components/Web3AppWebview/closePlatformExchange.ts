import { StackActions } from "@react-navigation/native";
import { NavigatorName } from "~/const";

export type ExchangeHostNavigation = {
  dispatch: (action: ReturnType<typeof StackActions.pop>) => void;
  getParent: () => ExchangeHostNavigation | undefined;
  getState: () => { routes: ReadonlyArray<{ name: string }> } | undefined;
};

function holdsPlatformExchange(navigation: ExchangeHostNavigation) {
  return (
    navigation.getState()?.routes.some(route => route.name === NavigatorName.PlatformExchange) ??
    false
  );
}

export function closePlatformExchange(navigation: ExchangeHostNavigation) {
  let exchangeHost: ExchangeHostNavigation | undefined = navigation;
  while (exchangeHost && !holdsPlatformExchange(exchangeHost)) {
    exchangeHost = exchangeHost.getParent();
  }
  exchangeHost?.dispatch(StackActions.pop());
}
