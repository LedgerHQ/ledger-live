import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { CardAssetDetailsDrawer } from "../CardAssetDetailsDrawer.native";
import { CardAssetDetailsWithdrawDrawer } from "../CardAssetDetailsWithdrawDrawer.native";
import { CardAssetsManageDrawer } from "../CardAssetsManageDrawer.native";
import { I18nWrapper } from "./i18nWrapper";
import type { CardAssetDialogCopy, CardAssetRow } from "../types";

const asset: CardAssetRow = {
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

const copy: CardAssetDialogCopy = {
  topUp: "Top up",
  withdraw: "Withdraw",
  transactions: "Transactions",
  withdrawTitle: "Continue to Baanx",
  withdrawDescription: "Withdraw funds to a Ledger account.",
  continue: "Continue",
};

describe("Card asset drawers (native)", () => {
  it("should forward asset actions when details are open", () => {
    const onTopUp = jest.fn();
    const onWithdraw = jest.fn();
    render(
      <CardAssetDetailsDrawer
        asset={asset}
        copy={copy}
        onTopUp={onTopUp}
        onWithdraw={onWithdraw}
        onShowHistory={jest.fn()}
        onTransactionPress={jest.fn()}
      />,
      { wrapper: I18nWrapper },
    );

    fireEvent.press(screen.getByText(copy.topUp));
    fireEvent.press(screen.getByText(copy.withdraw));

    expect(onTopUp).toHaveBeenCalledTimes(1);
    expect(onWithdraw).toHaveBeenCalledTimes(1);
  });

  it("should continue withdrawal when confirmation is pressed", () => {
    const onContinue = jest.fn();
    render(<CardAssetDetailsWithdrawDrawer copy={copy} onContinue={onContinue} />, {
      wrapper: I18nWrapper,
    });

    fireEvent.press(screen.getByText(copy.continue));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("should add an asset when the manage action is pressed", () => {
    const onAddAsset = jest.fn();
    render(<CardAssetsManageDrawer rows={[asset]} onAddAsset={onAddAsset} />, {
      wrapper: I18nWrapper,
    });

    expect(screen.getByText(asset.name)).toBeVisible();
    fireEvent.press(screen.getByText("Add asset"));

    expect(onAddAsset).toHaveBeenCalledTimes(1);
  });
});
