import React from "react";
import { render, screen } from "tests/testSetup";
import BigNumber from "bignumber.js";
import type { AleoOperation } from "@ledgerhq/live-common/families/aleo/types";
import { getOperationAmountNumber } from "@ledgerhq/live-common/operation";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import operationDetails from "../operationDetails";

const { OperationDetailsExtra, getAmount } = operationDetails;

describe("OperationDetailsExtra", () => {
  it("should only render functionId and not expose transactionType or patched", () => {
    const mockOperation: AleoOperation = {
      ...ALEO_ACCOUNT_1.operations[0],
      extra: {
        functionId: "transfer_public",
        transactionType: "public",
        patched: true,
      },
    };

    render(<OperationDetailsExtra account={ALEO_ACCOUNT_1} operation={mockOperation} type="OUT" />);

    expect(screen.getByText("transfer_public")).toBeInTheDocument();
    expect(screen.queryByText("transactionType")).not.toBeInTheDocument();
    expect(screen.queryByText("public")).not.toBeInTheDocument();
    expect(screen.queryByText("patched")).not.toBeInTheDocument();
  });
});

describe("getAmount", () => {
  it("returns -(value + fee) for BOND", () => {
    const op: AleoOperation = {
      ...ALEO_ACCOUNT_1.operations[0],
      type: "BOND",
      value: new BigNumber(5_000_000),
      fee: new BigNumber(34_060),
    };

    const expected = new BigNumber(5_000_000).plus(34_060).negated();
    expect(getAmount(op).isEqualTo(expected)).toBe(true);
  });

  it("returns -fee for UNBOND regardless of value", () => {
    const op: AleoOperation = {
      ...ALEO_ACCOUNT_1.operations[0],
      type: "UNBOND",
      value: new BigNumber(5_000_000),
      fee: new BigNumber(34_060),
    };

    const expected = new BigNumber(34_060).negated();
    expect(getAmount(op).isEqualTo(expected)).toBe(true);
  });

  it("returns (value - fee) for WITHDRAW_UNBONDED", () => {
    const op: AleoOperation = {
      ...ALEO_ACCOUNT_1.operations[0],
      type: "WITHDRAW_UNBONDED",
      value: new BigNumber(5_000_000),
      fee: new BigNumber(34_060),
    };

    const expected = new BigNumber(5_000_000).minus(34_060);
    expect(getAmount(op).isEqualTo(expected)).toBe(true);
  });

  it("falls back to getOperationAmountNumber for other operation types", () => {
    const op: AleoOperation = {
      ...ALEO_ACCOUNT_1.operations[0],
      type: "OUT",
      value: new BigNumber(5_000_000),
      fee: new BigNumber(34_060),
    };

    expect(getAmount(op).isEqualTo(getOperationAmountNumber(op))).toBe(true);
  });
});
