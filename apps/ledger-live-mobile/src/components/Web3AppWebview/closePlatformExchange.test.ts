import { StackActions } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { closePlatformExchange, type ExchangeHostNavigation } from "./closePlatformExchange";

type FakeNavigation = ExchangeHostNavigation & { dispatch: jest.Mock };

function fakeNavigation(routeNames: string[], parent?: FakeNavigation): FakeNavigation {
  return {
    dispatch: jest.fn(),
    getParent: () => parent,
    getState: () => ({ routes: routeNames.map(name => ({ name })) }),
  };
}

describe("closePlatformExchange", () => {
  it("should pop the exchange from the navigator of a live app that opens under Base", () => {
    const base = fakeNavigation([ScreenName.PlatformApp, NavigatorName.PlatformExchange]);
    const root = fakeNavigation([NavigatorName.Base]);
    jest.spyOn(base, "getParent").mockReturnValue(root);

    closePlatformExchange(base);

    expect(base.dispatch).toHaveBeenCalledWith(StackActions.pop());
    expect(root.dispatch).not.toHaveBeenCalled();
  });

  it("should pop the exchange from Base for a live app in a nested navigator", () => {
    const base = fakeNavigation([NavigatorName.Card, NavigatorName.PlatformExchange]);
    const card = fakeNavigation([ScreenName.Card], base);

    closePlatformExchange(card);

    expect(base.dispatch).toHaveBeenCalledWith(StackActions.pop());
    expect(card.dispatch).not.toHaveBeenCalled();
  });

  it("should pop nothing when no navigator holds the exchange", () => {
    const base = fakeNavigation([ScreenName.PlatformApp]);

    closePlatformExchange(base);

    expect(base.dispatch).not.toHaveBeenCalled();
  });
});
