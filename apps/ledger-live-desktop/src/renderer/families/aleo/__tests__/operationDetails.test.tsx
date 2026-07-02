import React from "react";
import { render, screen } from "tests/testSetup";
import type { AleoOperation } from "@ledgerhq/live-common/families/aleo/types";
import BigNumber from "bignumber.js";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import operationDetails from "../operationDetails";

const { OperationDetailsExtra } = operationDetails;

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
  const makeOperation = (patch: Partial<AleoOperation>): AleoOperation =>
    ({
      id: "op-id",
      hash: "hash",
      accountId: "account-id",
      type: "OUT",
      value: new BigNumber(0),
      fee: new BigNumber(5621),
      senders: ["aleo1sender"],
      recipients: ["aleo1recipient"],
      blockHeight: 100,
      blockHash: "block-hash",
      date: new Date("2026-07-01"),
      extra: { functionId: "transfer_public", transactionType: "public" },
      ...patch,
    }) as AleoOperation;

  const getAmount = operationDetails.getAmount!;

  it("shows Bond as the negated staked amount", () => {
    const operation = makeOperation({
      type: "BOND",
      extra: {
        functionId: "bond_public",
        transactionType: "public",
        estimatedBondedAmount: new BigNumber(10_000_000_000),
      },
    });
    expect(getAmount(operation)).toEqual(new BigNumber(-10_000_000_000));
  });

  it("falls back to -fee for Bond when the staked amount is unknown", () => {
    const operation = makeOperation({
      type: "BOND",
      extra: { functionId: "bond_public", transactionType: "public" },
    });
    expect(getAmount(operation)).toEqual(new BigNumber(-5621));
  });

  it("shows Unbond as -fee (default stake-family behavior)", () => {
    const operation = makeOperation({
      type: "UNBOND",
      extra: {
        functionId: "unbond_public",
        transactionType: "public",
        estimatedUnbondedAmount: new BigNumber(10_000_000_000),
      },
    });
    expect(getAmount(operation)).toEqual(new BigNumber(-5621));
  });

  it("shows Claim as the positive claimed amount", () => {
    const operation = makeOperation({
      type: "WITHDRAW_UNBONDED",
      extra: {
        functionId: "claim_unbond_public",
        transactionType: "public",
        estimatedWithdrawUnbondedAmount: new BigNumber(10_000_000_000),
      },
    });
    expect(getAmount(operation)).toEqual(new BigNumber(10_000_000_000));
  });

  it("falls back to -fee for Claim when the claimed amount is unknown", () => {
    const operation = makeOperation({
      type: "WITHDRAW_UNBONDED",
      extra: { functionId: "claim_unbond_public", transactionType: "public" },
    });
    expect(getAmount(operation)).toEqual(new BigNumber(-5621));
  });

  it("shows failed staking operations as -fee even when an amount is present", () => {
    const operation = makeOperation({
      type: "BOND",
      hasFailed: true,
      extra: {
        functionId: "bond_public",
        transactionType: "public",
        estimatedBondedAmount: new BigNumber(15_000_000),
      },
    });
    expect(getAmount(operation)).toEqual(new BigNumber(-5621));
  });

  it("keeps default amounts for non-staking operations", () => {
    const operation = makeOperation({ type: "IN", value: new BigNumber(20_000_000) });
    expect(getAmount(operation)).toEqual(new BigNumber(20_000_000));
  });
});

describe("amountCellExtra", () => {
  it("is not exported (no second amount column for staking rows)", () => {
    expect(operationDetails).not.toHaveProperty("amountCellExtra");
  });
});
