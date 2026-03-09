import { CommonActions } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { hasSwapTabRoute, navigateBackToSwapTab } from "../navigateBackToSwapTab";

describe("navigateBackToSwapTab", () => {
  const createNavigation = ({
    routeNames = [],
    parentNavigation,
  }: {
    routeNames?: string[];
    parentNavigation?: { dispatch: jest.Mock; goBack: jest.Mock } | undefined;
  }) => {
    const dispatch = jest.fn();
    const goBack = jest.fn();

    return {
      navigation: {
        dispatch,
        getState: () => ({ routeNames }) as const,
        getParent: () => parentNavigation,
        goBack,
      },
      dispatch,
      goBack,
    };
  };

  it("should detect when the current navigator contains SwapTab", () => {
    expect(hasSwapTabRoute({ routeNames: [ScreenName.SwapTab] } as const)).toBe(true);
    expect(hasSwapTabRoute({ routeNames: [ScreenName.SwapHistory] } as const)).toBe(false);
  });

  it("should reset locally to SwapTab when the current navigator contains SwapTab", () => {
    const { navigation, dispatch, goBack } = createNavigation({
      routeNames: [ScreenName.SwapTab, ScreenName.SwapHistory],
    });

    navigateBackToSwapTab({
      navigation,
      shouldDisplayWallet40MainNav: true,
    });

    expect(dispatch).toHaveBeenCalledWith(
      CommonActions.reset({
        index: 0,
        routes: [{ name: ScreenName.SwapTab }],
      }),
    );
    expect(goBack).not.toHaveBeenCalled();
  });

  it("should reset root navigation through Main and Swap in Wallet40", () => {
    const parentDispatch = jest.fn();
    const parentGoBack = jest.fn();
    const { navigation, dispatch } = createNavigation({
      routeNames: [ScreenName.SwapHistory],
      parentNavigation: { dispatch: parentDispatch, goBack: parentGoBack },
    });

    navigateBackToSwapTab({
      navigation,
      shouldDisplayWallet40MainNav: true,
    });

    expect(dispatch).not.toHaveBeenCalled();
    expect(parentDispatch).toHaveBeenCalledWith(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: NavigatorName.Main,
            params: {
              screen: NavigatorName.Swap,
              params: {
                screen: ScreenName.SwapTab,
              },
            },
          },
        ],
      }),
    );
    expect(parentGoBack).not.toHaveBeenCalled();
  });

  it("should reset root navigation to Swap in legacy flow", () => {
    const parentDispatch = jest.fn();
    const parentGoBack = jest.fn();
    const { navigation, dispatch } = createNavigation({
      routeNames: [ScreenName.SwapHistory],
      parentNavigation: { dispatch: parentDispatch, goBack: parentGoBack },
    });

    navigateBackToSwapTab({
      navigation,
      shouldDisplayWallet40MainNav: false,
    });

    expect(dispatch).not.toHaveBeenCalled();
    expect(parentDispatch).toHaveBeenCalledWith(
      CommonActions.reset({
        index: 1,
        routes: [
          {
            name: NavigatorName.Main,
          },
          {
            name: NavigatorName.Swap,
            params: {
              screen: ScreenName.SwapTab,
            },
          },
        ],
      }),
    );
    expect(parentGoBack).not.toHaveBeenCalled();
  });

  it("should fallback to goBack when no parent navigation exists", () => {
    const { navigation, dispatch, goBack } = createNavigation({
      routeNames: [ScreenName.SwapHistory],
    });

    navigateBackToSwapTab({
      navigation,
      shouldDisplayWallet40MainNav: true,
    });

    expect(dispatch).not.toHaveBeenCalled();
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
