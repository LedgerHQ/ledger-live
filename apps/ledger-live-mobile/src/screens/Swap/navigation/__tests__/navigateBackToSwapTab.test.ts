import { CommonActions } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { hasSwapTabRoute, navigateBackToSwapTab } from "../navigateBackToSwapTab";

describe("navigateBackToSwapTab", () => {
  const createNavigation = ({
    routeNames = [],
    parentNavigation,
  }: {
    routeNames?: string[];
    parentNavigation?:
      | { dispatch: jest.Mock; goBack: jest.Mock; canGoBack?: jest.Mock }
      | undefined;
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

  it("should pop the parent navigator in Wallet40 to preserve the back animation", () => {
    const parentDispatch = jest.fn();
    const parentGoBack = jest.fn();
    const parentCanGoBack = jest.fn(() => true);
    const { navigation, dispatch } = createNavigation({
      routeNames: [ScreenName.SwapHistory],
      parentNavigation: {
        dispatch: parentDispatch,
        goBack: parentGoBack,
        canGoBack: parentCanGoBack,
      },
    });

    navigateBackToSwapTab({
      navigation,
      shouldDisplayWallet40MainNav: true,
    });

    expect(dispatch).not.toHaveBeenCalled();
    expect(parentDispatch).not.toHaveBeenCalled();
    expect(parentGoBack).toHaveBeenCalledTimes(1);
  });

  it("should fall back to a root reset in Wallet40 when the parent cannot go back", () => {
    const parentDispatch = jest.fn();
    const parentGoBack = jest.fn();
    const parentCanGoBack = jest.fn(() => false);
    const { navigation, dispatch } = createNavigation({
      routeNames: [ScreenName.SwapHistory],
      parentNavigation: {
        dispatch: parentDispatch,
        goBack: parentGoBack,
        canGoBack: parentCanGoBack,
      },
    });

    navigateBackToSwapTab({
      navigation,
      shouldDisplayWallet40MainNav: true,
    });

    expect(dispatch).not.toHaveBeenCalled();
    expect(parentGoBack).not.toHaveBeenCalled();
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
