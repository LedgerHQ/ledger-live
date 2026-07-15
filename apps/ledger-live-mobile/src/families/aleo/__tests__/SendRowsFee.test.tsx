import React from "react";
import { Text } from "react-native";
import BigNumber from "bignumber.js";
import { render, screen } from "@tests/test-renderer";
import AleoSendRowsFee from "../SendRowsFee";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";

jest.mock("~/components/CurrencyUnitValue", () => {
  return ({ value }: { value: { toNumber: () => number } }) => <Text>fees:{value.toNumber()}</Text>;
});

jest.mock("~/components/CounterValue", () => {
  return ({ value }: { value: { toNumber: () => number } }) => (
    <Text>counter:{value.toNumber()}</Text>
  );
});

const baseTransaction = {
  family: "aleo" as const,
  amount: new BigNumber(100),
  recipient: "aleo1abc",
  useAllAmount: false,
  fees: new BigNumber(5),
};

const renderFeeRow = (
  statusOverrides: Record<string, unknown> | undefined,
  transaction = baseTransaction,
) =>
  render(
    <AleoSendRowsFee
      account={ALEO_ACCOUNT_1 as never}
      transaction={transaction as never}
      status={
        statusOverrides === undefined
          ? undefined
          : ({
              errors: {},
              warnings: {},
              amount: new BigNumber(100),
              totalSpent: new BigNumber(105),
              estimatedFees: new BigNumber(5),
              ...statusOverrides,
            } as never)
      }
      navigation={{} as never}
      route={{} as never}
    />,
  );

describe("AleoSendRowsFee", () => {
  it("shows the sponsored-by-Provable label when the fee is zero", () => {
    renderFeeRow({ estimatedFees: new BigNumber(0) });

    expect(screen.getByText("Sponsored by Provable")).toBeTruthy();
    expect(screen.queryByText("fees:0")).toBeNull();
    expect(screen.queryByText("counter:0")).toBeNull();
  });

  it("shows the fee amount and counter value when the fee is non-zero", () => {
    renderFeeRow({ estimatedFees: new BigNumber(5) });

    expect(screen.queryByText("Sponsored by Provable")).toBeNull();
    expect(screen.getByText("fees:5")).toBeTruthy();
    expect(screen.getByText("counter:5")).toBeTruthy();
  });

  it("shows the proof generation notice alert", () => {
    renderFeeRow({ estimatedFees: new BigNumber(5) });

    expect(
      screen.getByText("Aleo transaction requires proof generation. This may take some time."),
    ).toBeTruthy();
  });

  it("falls back to the transaction's own fees when status is undefined", () => {
    renderFeeRow(undefined, { ...baseTransaction, fees: new BigNumber(0) });

    expect(screen.getByText("Sponsored by Provable")).toBeTruthy();
  });

  it("falls back to a non-zero transaction fee when status is undefined", () => {
    renderFeeRow(undefined, { ...baseTransaction, fees: new BigNumber(7) });

    expect(screen.queryByText("Sponsored by Provable")).toBeNull();
    expect(screen.getByText("fees:7")).toBeTruthy();
  });
});
