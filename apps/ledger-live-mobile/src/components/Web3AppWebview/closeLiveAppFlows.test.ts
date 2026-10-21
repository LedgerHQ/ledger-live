import type { NavigationState } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { closeLiveAppFlows, type LiveAppFlowHostNavigation } from "./closeLiveAppFlows";

type Route = { key: string; name: string; state?: { key: string } };
type FakeNavigation = LiveAppFlowHostNavigation & { dispatch: jest.Mock };

function fakeNavigation(key: string, routes: Route[], parent?: FakeNavigation): FakeNavigation {
  return {
    dispatch: jest.fn(),
    getParent: () => parent,
    getState: () => ({ key, routes }) as never,
  };
}

/** The routes left once the dispatched action is applied. */
function remainingRoutes(navigation: FakeNavigation) {
  const [[toAction]] = navigation.dispatch.mock.calls;
  const state = navigation.getState() as unknown as NavigationState;
  return toAction(state).payload.routes.map((route: Route) => route.name);
}

describe("closeLiveAppFlows", () => {
  it("removes the flows stacked above the live app", () => {
    const base = fakeNavigation("base", [
      { key: "main", name: NavigatorName.Main },
      { key: "app", name: ScreenName.PlatformApp },
      { key: "sign", name: NavigatorName.SignTransaction },
      { key: "exchange", name: NavigatorName.PlatformExchange },
    ]);

    closeLiveAppFlows(base, "app");

    expect(remainingRoutes(base)).toEqual([NavigatorName.Main, ScreenName.PlatformApp]);
  });

  it("keeps the flows below the live app and the other routes above it", () => {
    const base = fakeNavigation("base", [
      { key: "sign-before", name: NavigatorName.SignMessage },
      { key: "app", name: ScreenName.PlatformApp },
      { key: "verify", name: ScreenName.VerifyAccount },
      { key: "settings", name: NavigatorName.Settings },
    ]);

    closeLiveAppFlows(base, "app");

    expect(remainingRoutes(base)).toEqual([
      NavigatorName.SignMessage,
      ScreenName.PlatformApp,
      NavigatorName.Settings,
    ]);
  });

  it("finds the flows of a live app in a nested navigator", () => {
    const base = fakeNavigation("base", [
      { key: "card-navigator", name: NavigatorName.Card, state: { key: "card" } },
      { key: "exchange", name: NavigatorName.PlatformExchange },
    ]);
    const card = fakeNavigation("card", [{ key: "card-screen", name: ScreenName.Card }], base);

    closeLiveAppFlows(card, "card-screen");

    expect(card.dispatch).not.toHaveBeenCalled();
    expect(remainingRoutes(base)).toEqual([NavigatorName.Card]);
  });

  it("does nothing when no flow is open", () => {
    const base = fakeNavigation("base", [{ key: "app", name: ScreenName.PlatformApp }]);

    closeLiveAppFlows(base, "app");

    expect(base.dispatch).not.toHaveBeenCalled();
  });
});
