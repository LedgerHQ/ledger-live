import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import {
  FilterOptionAmounts,
  FilterOptionCard,
} from "../components/Filter/BalanceFilterOptionParts.native";
import { USDC_ID } from "./fixtures";

describe("BalanceFilterOptionParts (Native)", () => {
  it("should select the option when the card is pressed", () => {
    const onSelect = jest.fn();
    render(
      <FilterOptionCard optionId={USDC_ID} selected={false} rowKey="usdc" onSelect={onSelect}>
        <></>
      </FilterOptionCard>,
    );

    fireEvent.press(screen.getByTestId("pay-card-balance-filter-option-usdc"));

    expect(onSelect).toHaveBeenCalledWith(USDC_ID);
  });

  it("should render the countervalue and crypto amount labels", () => {
    render(<FilterOptionAmounts countervalueLabel="$1,000.00" cryptoAmountLabel="1,000.00 USDC" />);

    expect(screen.getByText("$1,000.00")).toBeTruthy();
    expect(screen.getByText("1,000.00 USDC")).toBeTruthy();
  });
});
