import { CommonActions } from "@react-navigation/native";
import { BASE_NAVIGATOR_ID, ScreenName } from "~/const";
import {
  handlePendingOperationBeforeRemove,
  hasSwapTabRoute,
  isGoingToSwapHistory,
  navigateBackToSwapTab,
} from "../navigateBackToSwapTab";

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
    expect(hasSwapTabRoute(undefined)).toBe(false);
    expect(hasSwapTabRoute({})).toBe(false);
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

describe("handlePendingOperationBeforeRemove", () => {
  it("should call flow completed on native back from swap success", () => {
    const allowRemovalRef = { current: false };
    const preventDefault = jest.fn();
    const onFlowCompleted = jest.fn();

    handlePendingOperationBeforeRemove({
      event: {
        preventDefault,
        data: {
          action: CommonActions.goBack(),
        },
      },
      allowRemovalRef,
      onFlowCompleted,
    });

    // With a clean [SwapPendingOperation] stack, default back already returns to
    // SwapTab — no redirect needed, just notify flow completion.
    expect(onFlowCompleted).toHaveBeenCalledTimes(1);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(allowRemovalRef.current).toBe(false);
  });

  it("should allow the removal it triggered itself (close button)", () => {
    const allowRemovalRef = { current: true };
    const preventDefault = jest.fn();
    const onFlowCompleted = jest.fn();

    handlePendingOperationBeforeRemove({
      event: {
        preventDefault,
        data: {
          action: CommonActions.goBack(),
        },
      },
      allowRemovalRef,
      onFlowCompleted,
    });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(onFlowCompleted).not.toHaveBeenCalled();
  });

  it("should allow swap success to navigate to history", () => {
    const allowRemovalRef = { current: false };
    const preventDefault = jest.fn();
    const onFlowCompleted = jest.fn();

    handlePendingOperationBeforeRemove({
      event: {
        preventDefault,
        data: {
          action: CommonActions.reset({
            index: 0,
            routes: [{ name: ScreenName.SwapHistory }],
          }),
        },
      },
      allowRemovalRef,
      onFlowCompleted,
    });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(onFlowCompleted).not.toHaveBeenCalled();
  });

  it("should call flow completed when action payload has routes not going to SwapHistory", () => {
    const allowRemovalRef = { current: false };
    const onFlowCompleted = jest.fn();

    handlePendingOperationBeforeRemove({
      event: {
        preventDefault: jest.fn(),
        data: {
          action: CommonActions.reset({
            index: 0,
            routes: [{ name: ScreenName.SwapTab }],
          }),
        },
      },
      allowRemovalRef,
      onFlowCompleted,
    });

    expect(onFlowCompleted).toHaveBeenCalledTimes(1);
  });
});

describe("isGoingToSwapHistory", () => {
  it("should return false for falsy payloads", () => {
    expect(isGoingToSwapHistory(null)).toBe(false);
    expect(isGoingToSwapHistory(undefined)).toBe(false);
    expect(isGoingToSwapHistory(0)).toBe(false);
    expect(isGoingToSwapHistory("")).toBe(false);
  });

  it("should return false for non-object payload", () => {
    expect(isGoingToSwapHistory("some string")).toBe(false);
    expect(isGoingToSwapHistory(42)).toBe(false);
    expect(isGoingToSwapHistory(true)).toBe(false);
  });

  it("should return false for object without routes key", () => {
    expect(isGoingToSwapHistory({ type: "GO_BACK" })).toBe(false);
    expect(isGoingToSwapHistory({})).toBe(false);
  });

  it("should return false when routes is not an array", () => {
    expect(isGoingToSwapHistory({ routes: "not-an-array" })).toBe(false);
    expect(isGoingToSwapHistory({ routes: null })).toBe(false);
    expect(isGoingToSwapHistory({ routes: { name: ScreenName.SwapHistory } })).toBe(false);
  });

  it("should return false when routes array does not contain SwapHistory", () => {
    expect(isGoingToSwapHistory({ routes: [] })).toBe(false);
    expect(isGoingToSwapHistory({ routes: [{ name: ScreenName.SwapTab }] })).toBe(false);
  });

  it("should return true when routes array contains SwapHistory", () => {
    expect(isGoingToSwapHistory({ routes: [{ name: ScreenName.SwapHistory }] })).toBe(true);
    expect(
      isGoingToSwapHistory({
        routes: [{ name: ScreenName.SwapTab }, { name: ScreenName.SwapHistory }],
      }),
    ).toBe(true);
  });
});
