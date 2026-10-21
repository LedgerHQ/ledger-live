import { CommonActions, type NavigationState, type PartialState } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";

/** The native flows a Live App request opens on top of its webview. */
const LIVE_APP_FLOW_ROUTES = new Set<string>([
  NavigatorName.SignTransaction,
  NavigatorName.SignMessage,
  NavigatorName.PlatformExchange,
  ScreenName.VerifyAccount,
]);

type FlowHostState = {
  key: string;
  routes: ReadonlyArray<{
    key: string;
    name: string;
    state?: NavigationState | PartialState<NavigationState>;
  }>;
};

export type LiveAppFlowHostNavigation = {
  dispatch: (action: (state: NavigationState) => ReturnType<typeof CommonActions.reset>) => void;
  getParent: () => LiveAppFlowHostNavigation | undefined;
  getState: () => FlowHostState | undefined;
};

/**
 * Removes the Live App flows stacked above the route of the webview (`routeKey`), e.g. once its
 * main frame moved to another origin. Other routes are left as they are.
 */
export function closeLiveAppFlows(navigation: LiveAppFlowHostNavigation, routeKey: string): void {
  let host: LiveAppFlowHostNavigation | undefined = navigation;
  let ownKey: string | undefined = routeKey;
  while (host && ownKey) {
    const state = host.getState();
    if (!state) return;
    const ownIndex = state.routes.findIndex(route => route.key === ownKey);
    if (ownIndex === -1) return;
    const flowKeys = new Set(
      state.routes
        .slice(ownIndex + 1)
        .filter(route => LIVE_APP_FLOW_ROUTES.has(route.name))
        .map(route => route.key),
    );
    if (flowKeys.size > 0) {
      host.dispatch(current => {
        const routes = current.routes.filter(route => !flowKeys.has(route.key));
        return CommonActions.reset({ ...current, routes, index: routes.length - 1 });
      });
      return;
    }
    const parent: LiveAppFlowHostNavigation | undefined = host.getParent();
    ownKey = parent?.getState()?.routes.find(route => route.state?.key === state.key)?.key;
    host = parent;
  }
}
