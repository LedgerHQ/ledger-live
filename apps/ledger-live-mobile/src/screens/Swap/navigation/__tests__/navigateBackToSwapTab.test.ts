import { CommonActions } from "@react-navigation/native";
import { BASE_NAVIGATOR_ID, ScreenName } from "~/const";
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
    const getParent = jest.fn(() => parentNavigation);

    return {
      navigation: {
        dispatch,
        getState: () => ({ routeNames }) as const,
        getParent,
        goBack,
      },
      dispatch,
      goBack,
      getParent,
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
    });

    expect(dispatch).toHaveBeenCalledWith(
      CommonActions.reset({
        index: 0,
        routes: [{ name: ScreenName.SwapTab }],
      }),
    );
    expect(goBack).not.toHaveBeenCalled();
  });

  it("should go back through the Base navigator in Wallet40", () => {
    const parentDispatch = jest.fn();
    const parentGoBack = jest.fn();
    const { navigation, dispatch, goBack, getParent } = createNavigation({
      routeNames: [ScreenName.SwapHistory],
      parentNavigation: { dispatch: parentDispatch, goBack: parentGoBack },
    });

    navigateBackToSwapTab({
      navigation,
    });

    // The Base navigator must be targeted explicitly by id, not by tree position.
    expect(getParent).toHaveBeenCalledWith(BASE_NAVIGATOR_ID);
    expect(dispatch).not.toHaveBeenCalled();
    expect(goBack).not.toHaveBeenCalled();
    expect(parentDispatch).not.toHaveBeenCalled();
    expect(parentGoBack).toHaveBeenCalledTimes(1);
  });

  it("should fallback to goBack when no parent navigation exists", () => {
    const { navigation, dispatch, goBack } = createNavigation({
      routeNames: [ScreenName.SwapHistory],
    });

    navigateBackToSwapTab({
      navigation,
    });

    expect(dispatch).not.toHaveBeenCalled();
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
