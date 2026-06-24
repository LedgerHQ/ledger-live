import React from "react";
import BigNumber from "bignumber.js";
import { CommonActions } from "@react-navigation/native";
import { render, screen, waitFor } from "@tests/test-renderer";
import { BASE_NAVIGATOR_ID, ScreenName } from "~/const";
import { track } from "~/analytics";
import type { State } from "~/reducers/types";
import { PendingOperation } from "../PendingOperation";

const mockNotifyFlowCompleted = jest.fn();

jest.mock("LLM/features/NotificationsPrompt", () => ({
  useNotificationsContext: () => ({
    notifyFlowCompleted: mockNotifyFlowCompleted,
  }),
}));

function getCloseOnPress(navigation: ReturnType<typeof buildNavigation>): () => void {
  const opts = navigation.setOptions.mock.calls
    .map(([o]) => o as Record<string, unknown>)
    .find(o => typeof o?.headerRight === "function");
  const element = (opts?.headerRight as () => React.ReactElement<{ onPress: () => void }>)();
  return element.props.onPress;
}

function buildNavigation(routeNames: string[], parentGoBack = jest.fn()) {
  return {
    dispatch: jest.fn(),
    getState: () => ({ routeNames }),
    setOptions: jest.fn(),
    addListener: jest.fn().mockReturnValue(() => {}),
    getParent: jest.fn((id?: string) =>
      id === BASE_NAVIGATOR_ID ? { dispatch: jest.fn(), goBack: parentGoBack } : undefined,
    ),
    goBack: jest.fn(),
  };
}

const route = {
  params: {
    swapOperation: {
      swapId: "swap-1",
      provider: "lifi",
      status: "pending",
      receiverAccountId: "ethereum-account",
      operationId: "operation-1",
      fromAmount: new BigNumber(1),
      toAmount: new BigNumber(2),
    },
  },
};

const routeWithOptionalParams = {
  params: {
    isEmbeddedSwap: true,
    sponsored: true,
    swapOperation: {
      swapId: "swap-2",
      provider: "changelly",
      status: "pending",
      receiverAccountId: "ethereum-account",
      operationId: "operation-2",
      fromAmount: new BigNumber(1),
      toAmount: new BigNumber(2),
      toCurrency: { id: "ethereum", name: "Ethereum" },
    },
  },
};

describe("PendingOperation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotifyFlowCompleted.mockClear();
  });

  it("should navigate to swap history and open transaction status details", async () => {
    const navigation = buildNavigation([ScreenName.SwapTab, ScreenName.SwapHistory]);
    const { store, user } = render(
      <PendingOperation route={route as never} navigation={navigation as never} />,
    );

    await user.press(screen.getByText(/go to history/i));

    expect(navigation.dispatch).toHaveBeenCalledWith(
      CommonActions.reset({
        index: 1,
        routes: [{ name: ScreenName.SwapTab }, { name: ScreenName.SwapHistory }],
      }),
    );
    await waitFor(() => {
      expect(store.getState().swapTransactionStatusDrawer).toEqual<
        State["swapTransactionStatusDrawer"]
      >({
        isOpen: true,
        params: {
          swapId: "swap-1",
          provider: "lifi",
        },
      });
    });
  });

  it("should navigate locally to swap history and open transaction status details when SwapTab is unavailable", async () => {
    const navigation = buildNavigation([ScreenName.SwapHistory]);
    const { store, user } = render(
      <PendingOperation route={route as never} navigation={navigation as never} />,
    );

    await user.press(screen.getByText(/go to history/i));

    expect(navigation.dispatch).toHaveBeenCalledWith(
      CommonActions.reset({
        index: 0,
        routes: [{ name: ScreenName.SwapHistory }],
      }),
    );
    await waitFor(() => {
      expect(store.getState().swapTransactionStatusDrawer).toEqual<
        State["swapTransactionStatusDrawer"]
      >({
        isOpen: true,
        params: {
          swapId: "swap-1",
          provider: "lifi",
        },
      });
    });
  });

  it("should call notifyFlowCompleted and navigate to SwapTab when close button is pressed", async () => {
    const navigation = buildNavigation([ScreenName.SwapTab, ScreenName.SwapHistory]);
    render(<PendingOperation route={route as never} navigation={navigation as never} />);

    getCloseOnPress(navigation)();

    expect(mockNotifyFlowCompleted).toHaveBeenCalledWith("swap");
    expect(navigation.dispatch).toHaveBeenCalledWith(
      CommonActions.reset({ index: 0, routes: [{ name: ScreenName.SwapTab }] }),
    );
  });

  it("should track analytics when close button is pressed", () => {
    const navigation = buildNavigation([ScreenName.SwapTab, ScreenName.SwapHistory]);
    render(<PendingOperation route={route as never} navigation={navigation as never} />);

    getCloseOnPress(navigation)();

    expect(jest.mocked(track)).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "SwapCloseSuccess" }),
    );
  });

  it("should guard against double-tap on close button", () => {
    const navigation = buildNavigation([ScreenName.SwapTab, ScreenName.SwapHistory]);
    render(<PendingOperation route={route as never} navigation={navigation as never} />);

    const onPress = getCloseOnPress(navigation);
    onPress();
    onPress();

    expect(mockNotifyFlowCompleted).toHaveBeenCalledTimes(1);
    expect(navigation.dispatch).toHaveBeenCalledTimes(1);
  });

  it("should call notifyFlowCompleted on native back gesture", () => {
    const navigation = buildNavigation([ScreenName.SwapTab, ScreenName.SwapHistory]);
    render(<PendingOperation route={route as never} navigation={navigation as never} />);

    const beforeRemoveListener = navigation.addListener.mock.calls.find(
      ([event]: [string]) => event === "beforeRemove",
    )?.[1];

    expect(beforeRemoveListener).toBeDefined();
    beforeRemoveListener({
      preventDefault: jest.fn(),
      data: { action: CommonActions.goBack() },
    });

    expect(mockNotifyFlowCompleted).toHaveBeenCalledWith("swap");
  });

  it("should render with isEmbeddedSwap, sponsored, and toCurrency when provided", async () => {
    const navigation = buildNavigation([ScreenName.SwapTab, ScreenName.SwapHistory]);
    render(
      <PendingOperation
        route={routeWithOptionalParams as never}
        navigation={navigation as never}
      />,
    );

    expect(screen.getByTestId("swap-success-title")).toBeTruthy();
  });

  it("should not call notifyFlowCompleted on native back when close button already fired it", () => {
    const navigation = buildNavigation([ScreenName.SwapTab, ScreenName.SwapHistory]);
    render(<PendingOperation route={route as never} navigation={navigation as never} />);

    getCloseOnPress(navigation)();

    const beforeRemoveListener = navigation.addListener.mock.calls.find(
      ([event]: [string]) => event === "beforeRemove",
    )?.[1];
    beforeRemoveListener({
      preventDefault: jest.fn(),
      data: { action: CommonActions.goBack() },
    });

    // Only one call — from the close button; beforeRemove skips because allowRemovalRef is true
    expect(mockNotifyFlowCompleted).toHaveBeenCalledTimes(1);
  });
});
