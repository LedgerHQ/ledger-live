import React from "react";
import { screen } from "@testing-library/react";
import {
  FilterOptionAmounts,
  FilterOptionCard,
} from "../components/Filter/BalanceFilterOptionParts.web";
import { USDC_ID } from "./fixtures";
import { renderWithStyle } from "./renderWithStyle.web";

describe("BalanceFilterOptionParts (Web)", () => {
  it("should select the option when the card is clicked", async () => {
    const onSelect = jest.fn();
    renderWithStyle(
      <FilterOptionCard optionId={USDC_ID} selected={false} rowKey="usdc" onSelect={onSelect}>
        <span>USD Coin</span>
      </FilterOptionCard>,
    );

    await screen.getByTestId("pay-card-balance-filter-option-usdc").click();

    expect(onSelect).toHaveBeenCalledWith(USDC_ID);
  });

  it("should render the countervalue and crypto amount labels", () => {
    renderWithStyle(
      <FilterOptionAmounts countervalueLabel="$1,000.00" cryptoAmountLabel="1,000.00 USDC" />,
    );

    expect(screen.getByText("$1,000.00")).toBeVisible();
    expect(screen.getByText("1,000.00 USDC")).toBeVisible();
  });
});
