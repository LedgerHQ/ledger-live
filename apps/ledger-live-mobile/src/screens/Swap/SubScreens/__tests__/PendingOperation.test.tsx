import React from "react";
import BigNumber from "bignumber.js";
import { CommonActions } from "@react-navigation/native";
import { render, screen, waitFor } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import { PendingOperation } from "../PendingOperation";

function buildNavigation(routeNames: string[]) {
  return {
    dispatch: jest.fn(),
    getState: () => ({ routeNames }),
    setOptions: jest.fn(),
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

describe("PendingOperation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
