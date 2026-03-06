import { CommonActions } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import {
  getResetToSwapTabAction,
  hasSwapTabRoute,
  navigateBackToSwapTab,
} from "../navigateBackToSwapTab";

describe("navigateBackToSwapTab", () => {
  const createNavigation = ({
    routeNames = [],
    parentNavigation,
  }: {
    routeNames?: string[];
    parentNavigation?: { dispatchReset: jest.Mock } | undefined;
  }) => {
    const dispatchReset = jest.fn();
    const goBack = jest.fn();

    return {
      navigation: {
        dispatchReset,
        getState: () => ({ routeNames } as const),
        getParent: () => parentNavigation,
        goBack,
      },
      dispatchReset,
      goBack,
    };
  };

  it("should detect when the current navigator contains SwapTab", () => {
    expect(hasSwapTabRoute(() => ({ routeNames: [ScreenName.SwapTab] } as const))).toBe(true);
    expect(hasSwapTabRoute(() => ({ routeNames: [ScreenName.SwapHistory] } as const))).toBe(false);
  });

  it("should reset locally to SwapTab when the current navigator contains SwapTab", () => {
    const { navigation, dispatchReset, goBack } = createNavigation({
      routeNames: [ScreenName.SwapTab, ScreenName.SwapHistory],
    });

    navigateBackToSwapTab({
      navigation,
      shouldDisplayWallet40MainNav: true,
    });

    expect(dispatchReset).toHaveBeenCalledWith(
      CommonActions.reset({
        index: 0,
        routes: [{ name: ScreenName.SwapTab }],
      }),
    );
    expect(goBack).not.toHaveBeenCalled();
  });

  it("should reset root navigation through Main and Swap in Wallet40", () => {
    const parentDispatchReset = jest.fn();
    const { navigation, dispatchReset } = createNavigation({
      routeNames: [ScreenName.SwapHistory],
      parentNavigation: { dispatchReset: parentDispatchReset },
    });

    navigateBackToSwapTab({
      navigation,
      shouldDisplayWallet40MainNav: true,
    });

    expect(dispatchReset).not.toHaveBeenCalled();
    expect(parentDispatchReset).toHaveBeenCalledWith(
      getResetToSwapTabAction({ shouldDisplayWallet40MainNav: true }),
    );
  });

  it("should reset root navigation directly to Swap in legacy flow", () => {
    const parentDispatchReset = jest.fn();
    const { navigation, dispatchReset } = createNavigation({
      routeNames: [ScreenName.SwapHistory],
      parentNavigation: { dispatchReset: parentDispatchReset },
    });

    navigateBackToSwapTab({
      navigation,
      shouldDisplayWallet40MainNav: false,
    });

    expect(dispatchReset).not.toHaveBeenCalled();
    expect(parentDispatchReset).toHaveBeenCalledWith(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: NavigatorName.Swap,
            params: {
              screen: ScreenName.SwapTab,
            },
          },
        ],
      }),
    );
  });

  it("should fallback to goBack when no parent navigation exists", () => {
    const { navigation, dispatchReset, goBack } = createNavigation({
      routeNames: [ScreenName.SwapHistory],
    });

    navigateBackToSwapTab({
      navigation,
      shouldDisplayWallet40MainNav: true,
    });

    expect(dispatchReset).not.toHaveBeenCalled();
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
