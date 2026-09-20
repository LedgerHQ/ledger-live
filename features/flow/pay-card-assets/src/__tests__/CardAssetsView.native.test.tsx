import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { CardAssetDetailsDrawer } from "../CardAssetDetailsDrawer.native";
import { CardAssetDetailsWithdrawDrawer } from "../CardAssetDetailsWithdrawDrawer.native";
import { CardAssetsManageDrawer } from "../CardAssetsManageDrawer.native";
import { CardAssetsView } from "../CardAssetsView.native";
import { CARD_ASSETS_COPY, I18nWrapper } from "./i18nWrapper";
import type { CardAssetsViewModel } from "../types";

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const ReactActual = require("react");
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  return new Proxy(actual, {
    get(target, prop) {
      if (prop === "TooltipContent") {
        return function TooltipContent({
          title,
          content,
          children,
          ...props
        }: {
          title?: string;
          content?: React.ReactNode;
          children?: React.ReactNode;
        }) {
          return ReactActual.createElement(
            "TooltipContent",
            props,
            title === undefined ? null : ReactActual.createElement("Text", undefined, title),
            content,
            children,
          );
        };
      }
      return Reflect.get(target, prop);
    },
  });
});

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

    expect(screen.getAllByText(CARD_ASSETS_COPY.title)[0]).toBeVisible();
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

    expect(screen.getAllByText(CARD_ASSETS_COPY.title)[0]).toBeVisible();
    expect(screen.getByTestId("card-assets-loading-state")).toBeVisible();
    expect(screen.queryByText(CARD_ASSETS_COPY.empty)).not.toBeOnTheScreen();
    expect(screen.queryByText(CARD_ASSETS_COPY.error)).not.toBeOnTheScreen();
  });

  it("should ask the view model to open the selected asset", () => {
    const onAssetPress = jest.fn();
    render(<CardAssetsView {...ready} onAssetPress={onAssetPress} />, {
      wrapper: I18nWrapper,
    });

    fireEvent.press(screen.getByText("USD Coin"));

    expect(onAssetPress).toHaveBeenCalledWith(usdc);
  });

  it("should show the asset details and its empty transaction state in a drawer", () => {
    render(
      <CardAssetDetailsDrawer
        asset={usdc}
        transactions={[]}
        copy={ready.dialogCopy}
        formatBalance={value => ({
          integerPart: String(Math.trunc(value)),
          decimalPart: "40",
          currencyText: "$",
          decimalSeparator: ".",
          currencyPosition: "start",
        })}
        onTopUp={jest.fn()}
        onWithdraw={jest.fn()}
        onShowHistory={jest.fn()}
        onTransactionPress={jest.fn()}
      />,
      { wrapper: I18nWrapper },
    );

    expect(screen.getByText(CARD_ASSETS_COPY.topUp)).toBeVisible();
    expect(screen.getByText(CARD_ASSETS_COPY.withdraw)).toBeVisible();
    expect(screen.queryByText(CARD_ASSETS_COPY.transactions)).not.toBeOnTheScreen();
    expect(screen.getByText(CARD_ASSETS_COPY.transactionsEmpty)).toBeVisible();
  });

  it("should forward the asset actions from the details drawer", () => {
    const onTopUpPress = jest.fn();
    const onWithdrawPress = jest.fn();
    render(
      <CardAssetDetailsDrawer
        asset={usdc}
        copy={ready.dialogCopy}
        onTopUp={onTopUpPress}
        onWithdraw={onWithdrawPress}
        onShowHistory={jest.fn()}
        onTransactionPress={jest.fn()}
      />,
      { wrapper: I18nWrapper },
    );

    fireEvent.press(screen.getByText(CARD_ASSETS_COPY.topUp));
    fireEvent.press(screen.getByText(CARD_ASSETS_COPY.withdraw));

    expect(onTopUpPress).toHaveBeenCalledTimes(1);
    expect(onWithdrawPress).toHaveBeenCalledTimes(1);
  });

  it("should match the desktop withdraw confirmation and continue through the view model", () => {
    const onWithdrawContinue = jest.fn();
    render(
      <CardAssetDetailsWithdrawDrawer copy={ready.dialogCopy} onContinue={onWithdrawContinue} />,
      { wrapper: I18nWrapper },
    );

    expect(screen.getByText(CARD_ASSETS_COPY.withdrawTitle)).toBeVisible();
    expect(screen.getByText(CARD_ASSETS_COPY.withdrawDescription)).toBeVisible();

    fireEvent.press(screen.getByText(CARD_ASSETS_COPY.continue));

    expect(onWithdrawContinue).toHaveBeenCalledTimes(1);
  });

  it("should use the native tooltip heading and content, and ask the view model to manage assets", () => {
    const onManagePress = jest.fn();
    render(<CardAssetsView {...ready} onManagePress={onManagePress} />, {
      wrapper: I18nWrapper,
    });

    expect(screen.getByTestId("card-assets-info")).toHaveProp(
      "accessibilityLabel",
      CARD_ASSETS_COPY.info,
    );
    expect(screen.getByText(CARD_ASSETS_COPY.info)).toBeVisible();
    expect(screen.getAllByText(CARD_ASSETS_COPY.title)).toHaveLength(2);

    fireEvent.press(screen.getByTestId("card-assets-manage"));

    expect(onManagePress).toHaveBeenCalledTimes(1);
  });

  it("should match the desktop manage dialog and add an asset through the view model", () => {
    const onAddAssetPress = jest.fn();
    render(<CardAssetsManageDrawer rows={ready.rows} onAddAsset={onAddAssetPress} />, {
      wrapper: I18nWrapper,
    });

    expect(screen.getByText(CARD_ASSETS_COPY.manageDialogTitle)).toBeVisible();
    expect(screen.getByText(CARD_ASSETS_COPY.manageDialogDescription)).toBeVisible();
    expect(screen.getByText("USD Coin")).toBeVisible();
    expect(screen.getByText(CARD_ASSETS_COPY.addAssetCaption)).toBeVisible();

    fireEvent.press(screen.getByText(CARD_ASSETS_COPY.addAsset));

    expect(onAddAssetPress).toHaveBeenCalledTimes(1);
  });

  it("should hide the add asset action when the host does not provide it", () => {
    render(<CardAssetsManageDrawer rows={ready.rows} />, { wrapper: I18nWrapper });

    expect(screen.queryByText(CARD_ASSETS_COPY.addAssetCaption)).not.toBeOnTheScreen();
    expect(screen.queryByText(CARD_ASSETS_COPY.addAsset)).not.toBeOnTheScreen();
  });
});
