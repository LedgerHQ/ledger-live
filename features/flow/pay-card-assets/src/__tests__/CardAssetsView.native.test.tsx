import React from "react";
import { act, fireEvent, render, screen, userEvent } from "@testing-library/react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { CardAssetsManageDrawer } from "../CardAssetsManageDrawer.native";
import { CardAssetsView } from "../CardAssetsView.native";
import { CARD_ASSETS_COPY, I18nWrapper } from "./i18nWrapper";
import type { CardAssetsViewModel } from "../types";

// Waits past a requestAnimationFrame tick, for assertions that depend on work the drawer
// defers to the next frame (see CardAssetsManageDrawer.native.tsx's handleDragEnd).
function flushMicrotasks() {
  return new Promise(resolve => setTimeout(resolve, 20));
}

const usdc = {
  id: "w-usdc",
  currency: "usdc",
  network: "ethereum",
  name: "USD Coin",
  ticker: "USDC",
  ledgerId: "ethereum/erc20/usd__coin",
  cryptoAmount: "125.40 USDC",
  countervalue: "$125.40",
  countervalueAmount: 125.4,
};

const ready: CardAssetsViewModel = {
  isVisible: true,
  status: "ready",
  rows: [usdc],
  dialogState: "closed",
  selectedAsset: null,
  selectedAssetTransactions: [],
  dialogCopy: {
    topUp: "Top up",
    withdraw: "Withdraw",
    transactions: "Transactions",
    withdrawTitle: "You'll be redirected to Baanx",
    withdrawDescription: "Withdraw funds from your Baanx account to your Ledger wallet address.",
    continue: "Continue",
  },
  onAssetPress: jest.fn(),
  onDialogClose: jest.fn(),
  onTopUpPress: jest.fn(),
  onWithdrawPress: jest.fn(),
  onWithdrawClose: jest.fn(),
  onShowHistoryPress: jest.fn(),
  onWithdrawContinue: jest.fn(),
  onManagePress: jest.fn(),
  onAddAssetPress: jest.fn(),
  onMoveAsset: jest.fn(),
  reorderingAssetIds: new Set(),
};

describe("CardAssetsView (native)", () => {
  it("should name each wallet and show what it holds and what that is worth", () => {
    render(<CardAssetsView {...ready} />, { wrapper: I18nWrapper });

    expect(screen.getByText(CARD_ASSETS_COPY.title)).toBeVisible();
    expect(screen.getByText("USD Coin")).toBeVisible();
    expect(screen.getByText("USDC")).toBeVisible();
    expect(screen.getByText("125.40 USDC")).toBeVisible();
    expect(screen.getByTestId("card-asset-countervalue-w-usdc")).toHaveTextContent("$125.40");
  });

  it("should reserve the countervalue line while a wallet cannot be priced", () => {
    render(<CardAssetsView {...ready} rows={[{ ...usdc, countervalue: null }]} />, {
      wrapper: I18nWrapper,
    });

    expect(screen.getByText("125.40 USDC")).toBeVisible();
    expect(screen.getByTestId("card-asset-countervalue-w-usdc")).toBeVisible();
  });

  it("should give each wallet its own counter value", () => {
    render(
      <CardAssetsView
        {...ready}
        rows={[
          usdc,
          {
            id: "w-btc",
            currency: "btc",
            network: "bitcoin",
            name: "Bitcoin",
            ticker: "BTC",
            ledgerId: "bitcoin",
            cryptoAmount: "0.5 BTC",
            countervalue: "$9,900.00",
            countervalueAmount: 9900,
          },
        ]}
      />,
      { wrapper: I18nWrapper },
    );

    expect(screen.getByTestId("card-asset-countervalue-w-usdc")).toHaveTextContent("$125.40");
    expect(screen.getByTestId("card-asset-countervalue-w-btc")).toHaveTextContent("$9,900.00");
  });

  it("should render nothing when the card is not signed in", () => {
    render(<CardAssetsView {...ready} isVisible={false} />, {
      wrapper: I18nWrapper,
    });

    expect(screen.queryByText(CARD_ASSETS_COPY.title)).not.toBeOnTheScreen();
  });

  it("should say so when the read failed", () => {
    render(<CardAssetsView {...ready} status="error" />, {
      wrapper: I18nWrapper,
    });

    expect(screen.getByText(CARD_ASSETS_COPY.error)).toBeVisible();
    expect(screen.queryByText("125.40 USDC")).not.toBeOnTheScreen();
  });

  it("should say so when the card has no wallets", () => {
    render(<CardAssetsView {...ready} status="empty" rows={[]} />, {
      wrapper: I18nWrapper,
    });

    expect(screen.getByText(CARD_ASSETS_COPY.empty)).toBeVisible();
  });

  it("should show a skeleton list while the wallets are still loading", () => {
    render(<CardAssetsView {...ready} status="loading" rows={[]} />, {
      wrapper: I18nWrapper,
    });

    expect(screen.getByText(CARD_ASSETS_COPY.title)).toBeVisible();
    expect(screen.getByTestId("card-assets-loading-state")).toBeVisible();
    expect(screen.queryByText(CARD_ASSETS_COPY.empty)).not.toBeOnTheScreen();
    expect(screen.queryByText(CARD_ASSETS_COPY.error)).not.toBeOnTheScreen();
  });

  it("should open the selected asset", async () => {
    const user = userEvent.setup();
    const onAssetPress = jest.fn();
    render(<CardAssetsView {...ready} onAssetPress={onAssetPress} />, {
      wrapper: I18nWrapper,
    });

    await user.press(screen.getByText("USD Coin"));

    expect(onAssetPress).toHaveBeenCalledWith(usdc);
  });

  it("should open asset management", async () => {
    const user = userEvent.setup();
    const onManagePress = jest.fn();
    render(<CardAssetsView {...ready} onManagePress={onManagePress} />, {
      wrapper: I18nWrapper,
    });

    expect(screen.getByTestId("card-assets-info")).toHaveProp(
      "accessibilityLabel",
      CARD_ASSETS_COPY.info,
    );
    await user.press(screen.getByText(CARD_ASSETS_COPY.manage));

    expect(onManagePress).toHaveBeenCalledTimes(1);
  });

  it("should show managed assets", () => {
    render(
      <CardAssetsManageDrawer
        rows={ready.rows}
        onMoveAsset={jest.fn()}
        reorderingAssetIds={new Set()}
      />,
      { wrapper: I18nWrapper },
    );

    expect(screen.getByText(CARD_ASSETS_COPY.manageDialogTitle)).toBeVisible();
    expect(screen.getByText(CARD_ASSETS_COPY.manageDialogDescription)).toBeVisible();
    expect(screen.getByText("USD Coin")).toBeVisible();
  });

  it("should move a wallet up in funding order via the handle's accessibility action", () => {
    const onMoveAsset = jest.fn();
    const bitcoin = { ...usdc, id: "w-btc", name: "Bitcoin", ticker: "BTC" };
    render(
      <CardAssetsManageDrawer
        rows={[usdc, bitcoin]}
        onMoveAsset={onMoveAsset}
        reorderingAssetIds={new Set()}
      />,
      { wrapper: I18nWrapper },
    );

    fireEvent(screen.getByTestId("card-asset-reorder-handle-w-btc"), "accessibilityAction", {
      nativeEvent: { actionName: "decrement" },
    });

    expect(onMoveAsset).toHaveBeenCalledWith("w-btc", 0);
  });

  it("should move a wallet to where a drag was dropped", async () => {
    const onMoveAsset = jest.fn().mockResolvedValue(undefined);
    const bitcoin = { ...usdc, id: "w-btc", name: "Bitcoin", ticker: "BTC" };
    render(
      <CardAssetsManageDrawer
        rows={[usdc, bitcoin]}
        onMoveAsset={onMoveAsset}
        reorderingAssetIds={new Set()}
      />,
      { wrapper: I18nWrapper },
    );

    const { onDragBegin, onPlaceholderIndexChange, onDragEnd } =
      screen.UNSAFE_getByType(DraggableFlatList).props;

    // The user picks up USDC (index 0), drags it past Bitcoin, and drops it at index 1.
    await act(async () => {
      onDragBegin(0);
      onPlaceholderIndexChange(1);
      onDragEnd({ data: [bitcoin, usdc], from: 0, to: 1 });
      await flushMicrotasks();
    });

    expect(onMoveAsset).toHaveBeenCalledWith("w-usdc", 1);
  });

  it("should not flash the spinner when a drag settles back where it started", () => {
    const bitcoin = { ...usdc, id: "w-btc", name: "Bitcoin", ticker: "BTC" };
    render(
      <CardAssetsManageDrawer
        rows={[usdc, bitcoin]}
        onMoveAsset={jest.fn()}
        reorderingAssetIds={new Set()}
      />,
      { wrapper: I18nWrapper },
    );

    const { onDragBegin, onRelease } = screen.UNSAFE_getByType(DraggableFlatList).props;

    act(() => {
      onDragBegin(0);
      onRelease(0);
    });

    expect(screen.queryByTestId("card-asset-reorder-spinner-w-usdc")).not.toBeOnTheScreen();
  });

  it("should show the spinner as soon as a drag is released onto a different row", () => {
    const bitcoin = { ...usdc, id: "w-btc", name: "Bitcoin", ticker: "BTC" };
    render(
      <CardAssetsManageDrawer
        rows={[usdc, bitcoin]}
        onMoveAsset={() => new Promise(() => {})}
        reorderingAssetIds={new Set()}
      />,
      { wrapper: I18nWrapper },
    );

    const { onDragBegin, onPlaceholderIndexChange, onRelease } =
      screen.UNSAFE_getByType(DraggableFlatList).props;

    act(() => {
      onDragBegin(0);
      onPlaceholderIndexChange(1);
      onRelease(0);
    });

    expect(screen.getByTestId("card-asset-reorder-spinner-w-usdc")).toBeVisible();
  });
});
