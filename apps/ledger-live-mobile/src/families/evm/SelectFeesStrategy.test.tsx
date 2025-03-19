import BigNumber from "bignumber.js";
import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import SelectFeesStrategy from "./SelectFeesStrategy";
import { Transaction } from "@ledgerhq/coin-evm/lib/types/transaction";
import { AccountLike } from "@ledgerhq/types-live";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: jest.fn().mockReturnValue({ params: {} }),
  useNavigation: jest.fn().mockReturnValue({ navigate: jest.fn() }),
}));

describe("SelectFeesStrategy", () => {
  it("displays fees strategies along with estimated times", () => {
    render(
      <SelectFeesStrategy
        gasOptions={{
          slow: {
            maxPriorityFeePerGas: null,
            maxFeePerGas: null,
            gasPrice: BigNumber(2000000000000),
            nextBaseFee: null,
          },
          medium: {
            maxPriorityFeePerGas: null,
            maxFeePerGas: null,
            gasPrice: BigNumber(3000000000000),
            nextBaseFee: null,
          },
          fast: {
            maxPriorityFeePerGas: null,
            maxFeePerGas: null,
            gasPrice: BigNumber(4000000000000),
            nextBaseFee: null,
          },
        }}
        customFees={null}
        account={
          {
            type: "Account",
            currency: { units: [{ name: "eth", code: "eth", magnitude: 18 }] },
          } as unknown as AccountLike
        }
        transaction={
          {
            gasLimit: BigNumber(15000),
            type: 0,
          } as unknown as Transaction
        }
        onStrategySelect={() => {
          return;
        }}
        onCustomFeesPress={() => {
          return;
        }}
      />,
    );

    expect(screen.queryByTestId("fee-time-slow")).toHaveTextContent("≈ 2-3 min");
    expect(screen.queryByTestId("fee-label-slow")).toHaveTextContent("slow");
    expect(screen.queryByTestId("fees-amount-slow")).toHaveTextContent("0.03 eth");

    expect(screen.queryByTestId("fee-time-medium")).toHaveTextContent("≈ 30 sec");
    expect(screen.queryByTestId("fee-label-medium")).toHaveTextContent("medium");
    expect(screen.queryByTestId("fees-amount-medium")).toHaveTextContent("0.045 eth");

    expect(screen.queryByTestId("fee-time-fast")).toHaveTextContent("≈ 15 sec");
    expect(screen.queryByTestId("fee-label-fast")).toHaveTextContent("fast");
    expect(screen.queryByTestId("fees-amount-fast")).toHaveTextContent("0.06 eth");
  });
});
