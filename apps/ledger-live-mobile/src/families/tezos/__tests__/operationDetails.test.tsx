import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { render, screen } from "@tests/test-renderer";
import type { Operation } from "@ledgerhq/types-live";
import operationDetails from "../operationDetails";

const currency = getCryptoCurrencyById("tezos");
const unit = currency.units[0];

jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ name: "tezos", code: "XTZ", magnitude: 6 }),
}));

const { OperationDetailsExtra, amountCell } = operationDetails as unknown as {
  OperationDetailsExtra: React.ComponentType<{ account: object; operation: Operation }>;
  amountCell: Record<
    string,
    React.ComponentType<{ operation: Operation; currency: object; unit: object }>
  >;
};

const account = { id: "tezos-acc-1", type: "Account", currency };

const makeOp = (type: string, value: BigNumber): Operation =>
  ({
    id: `op-${type}`,
    hash: "hash",
    type,
    value,
    fee: new BigNumber(665),
    senders: [],
    recipients: [],
    accountId: "tezos-acc-1",
    blockHeight: 1,
    date: new Date(),
    extra: {},
  }) as unknown as Operation;

describe("Tezos operationDetails", () => {
  it("surfaces the staked principal (not the fee) for a STAKE operation", () => {
    render(
      <OperationDetailsExtra account={account} operation={makeOp("STAKE", new BigNumber(1e7))} />,
    );
    expect(screen.getByTestId("operationDetails-stakedAmount")).toBeTruthy();
    expect(screen.getByText(/10 XTZ/)).toBeTruthy();
  });

  it("surfaces the unstaked principal for an UNSTAKE operation", () => {
    render(
      <OperationDetailsExtra account={account} operation={makeOp("UNSTAKE", new BigNumber(1e7))} />,
    );
    expect(screen.getByTestId("operationDetails-unstakedAmount")).toBeTruthy();
    expect(screen.getByText(/10 XTZ/)).toBeTruthy();
  });

  it("surfaces the withdrawn principal for a FINALIZE_UNSTAKE operation", () => {
    render(
      <OperationDetailsExtra
        account={account}
        operation={makeOp("FINALIZE_UNSTAKE", new BigNumber(1e7))}
      />,
    );
    expect(screen.getByTestId("operationDetails-withdrawnAmount")).toBeTruthy();
    expect(screen.getByText(/10 XTZ/)).toBeTruthy();
  });

  it("renders nothing for a non-stake operation", () => {
    render(
      <OperationDetailsExtra
        account={account}
        operation={makeOp("DELEGATE", new BigNumber(1e7))}
      />,
    );
    expect(screen.queryByTestId("operationDetails-stakedAmount")).toBeNull();
  });

  it("shows the staked principal in the list amount cell", () => {
    const Cell = amountCell.STAKE;
    render(
      <Cell operation={makeOp("STAKE", new BigNumber(1e7))} currency={currency} unit={unit} />,
    );
    expect(screen.getByText(/10 XTZ/)).toBeTruthy();
  });

  it("renders no list amount cell when the staked value is zero", () => {
    const Cell = amountCell.STAKE;
    const { toJSON } = render(
      <Cell operation={makeOp("STAKE", new BigNumber(0))} currency={currency} unit={unit} />,
    );
    expect(toJSON()).toBeNull();
  });
});
