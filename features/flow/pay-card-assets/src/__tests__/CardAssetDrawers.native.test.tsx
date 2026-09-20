import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { CardAssetDetailsDrawer } from "../CardAssetDetailsDrawer.native";
import { CardAssetDetailsWithdrawDrawer } from "../CardAssetDetailsWithdrawDrawer.native";
import { CARD_ASSETS_COPY, I18nWrapper } from "./i18nWrapper";
import type { CardAssetRow } from "../types";

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

describe("Card asset drawers (native)", () => {
  it("should forward asset actions when details are open", () => {
    const onTopUp = jest.fn();
    const onWithdraw = jest.fn();
    render(
      <CardAssetDetailsDrawer
        asset={asset}
        onTopUp={onTopUp}
        onWithdraw={onWithdraw}
        onShowHistory={jest.fn()}
        onTransactionPress={jest.fn()}
      />,
      { wrapper: I18nWrapper },
    );

    fireEvent.press(screen.getByText(CARD_ASSETS_COPY.topUp));
    fireEvent.press(screen.getByText(CARD_ASSETS_COPY.withdraw));

    expect(onTopUp).toHaveBeenCalledTimes(1);
    expect(onWithdraw).toHaveBeenCalledTimes(1);
  });

  it("should continue withdrawal when confirmation is pressed", () => {
    const onContinue = jest.fn();
    render(<CardAssetDetailsWithdrawDrawer onContinue={onContinue} />, {
      wrapper: I18nWrapper,
    });

    fireEvent.press(screen.getByText(CARD_ASSETS_COPY.continue));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
