import { StackActions } from "@react-navigation/native";
import { BASE_NAVIGATOR_ID, NavigatorName, ScreenName } from "~/const";
import { openSwapSubScreens, type SwapSubScreensTarget } from "../openSwapSubScreens";

const TARGET: SwapSubScreensTarget = { screen: ScreenName.SwapHistory };

/** `baseRoutes` is the BaseNavigator stack, last route being the focused one. */
function setup({ baseRoutes }: { baseRoutes?: string[] } = {}) {
  const dispatch = jest.fn();
  const navigate = jest.fn();
  const getParent = jest.fn(() =>
    baseRoutes
      ? {
          dispatch,
          getState: () => ({
            index: baseRoutes.length - 1,
            routes: baseRoutes.map(name => ({ name })),
          }),
        }
      : undefined,
  );

  const navigation = { navigate, getParent } as unknown as Parameters<
    typeof openSwapSubScreens
  >[0]["navigation"];

  return { dispatch, navigate, getParent, navigation };
}

describe("openSwapSubScreens", () => {
  it("replaces the focused route when it is a transient swap screen", () => {
    const { dispatch, navigate, getParent, navigation } = setup({
      baseRoutes: [NavigatorName.Main, NavigatorName.SwapSubScreens],
    });

    openSwapSubScreens({ navigation, target: TARGET });

    expect(getParent).toHaveBeenCalledWith(BASE_NAVIGATOR_ID);
    expect(dispatch).toHaveBeenCalledWith(
      StackActions.replace(NavigatorName.SwapSubScreens, TARGET),
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it("replaces the focused route when the device exchange flow is on top", () => {
    const { dispatch, navigate, navigation } = setup({
      baseRoutes: [NavigatorName.Main, NavigatorName.PlatformExchange],
    });

    openSwapSubScreens({ navigation, target: TARGET });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("pushes when Main is focused, so the tab navigator stays mounted", () => {
    const { dispatch, navigate, navigation } = setup({ baseRoutes: [NavigatorName.Main] });

    openSwapSubScreens({ navigation, target: TARGET });

    expect(dispatch).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(NavigatorName.SwapSubScreens, TARGET);
  });

  it("pushes when an unrelated screen is focused rather than replacing it", () => {
    const { dispatch, navigate, navigation } = setup({
      baseRoutes: [NavigatorName.Main, NavigatorName.Accounts],
    });

    openSwapSubScreens({ navigation, target: TARGET });

    expect(dispatch).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(NavigatorName.SwapSubScreens, TARGET);
  });

  it("pushes when the base navigator cannot be resolved", () => {
    const { dispatch, navigate, navigation } = setup();

    openSwapSubScreens({ navigation, target: TARGET });

    expect(dispatch).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(NavigatorName.SwapSubScreens, TARGET);
  });
});
