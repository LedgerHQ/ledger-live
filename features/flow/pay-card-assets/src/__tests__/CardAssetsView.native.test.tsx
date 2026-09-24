import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { CardAssetsManageDrawer } from "../CardAssetsManageDrawer.native";
import { CardAssetsView } from "../CardAssetsView.native";
import { CARD_ASSETS_COPY, I18nWrapper } from "./i18nWrapper";
import type { CardAssetsViewModel } from "../types";

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
  onReorderAssets: jest.fn(),
  reorderingAssetId: null,
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

  it("should show managed assets and add another asset", async () => {
    const user = userEvent.setup();
    const onAddAsset = jest.fn();
    render(<CardAssetsManageDrawer rows={ready.rows} onAddAsset={onAddAsset} />, {
      wrapper: I18nWrapper,
    });

    expect(screen.getByText(CARD_ASSETS_COPY.manageDialogTitle)).toBeVisible();
    expect(screen.getByText(CARD_ASSETS_COPY.manageDialogDescription)).toBeVisible();
    expect(screen.getByText("USD Coin")).toBeVisible();
    expect(screen.getByText(CARD_ASSETS_COPY.addAssetCaption)).toBeVisible();

    await user.press(screen.getByText(CARD_ASSETS_COPY.addAsset));

    expect(onAddAsset).toHaveBeenCalledTimes(1);
  });

  it("should hide the add asset action when the host does not provide it", () => {
    render(<CardAssetsManageDrawer rows={ready.rows} />, { wrapper: I18nWrapper });

    expect(screen.queryByText(CARD_ASSETS_COPY.addAssetCaption)).not.toBeOnTheScreen();
    expect(screen.queryByText(CARD_ASSETS_COPY.addAsset)).not.toBeOnTheScreen();
  });
});
