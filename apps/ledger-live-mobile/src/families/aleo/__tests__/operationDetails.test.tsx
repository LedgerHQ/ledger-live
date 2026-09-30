import React from "react";
import { BigNumber } from "bignumber.js";
import { render, screen } from "@tests/test-renderer";
import type { AleoOperation } from "@ledgerhq/live-common/families/aleo/types";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import operationDetails from "../operationDetails";

const { OperationDetailsExtra, operationStatusIcon } = operationDetails;
const AleoOperationStatusIcon = operationStatusIcon.OUT;

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

    expect(screen.getByText("Function ID")).toBeOnTheScreen();
    expect(screen.getByText("transfer_public")).toBeOnTheScreen();
    expect(screen.queryByText("transactionType")).not.toBeOnTheScreen();
    expect(screen.queryByText("public")).not.toBeOnTheScreen();
    expect(screen.queryByText("patched")).not.toBeOnTheScreen();
  });

  it("renders validator and staked amount for a BOND operation", () => {
    const mockOperation: AleoOperation = {
      ...ALEO_ACCOUNT_1.operations[0],
      type: "BOND",
      extra: {
        functionId: "bond_public",
        transactionType: "public",
        validator: "aleo1validator",
        stakedAmount: new BigNumber(1500000),
      },
    };

    render(
      <OperationDetailsExtra account={ALEO_ACCOUNT_1} operation={mockOperation} type="BOND" />,
    );

    expect(screen.getByText("Validator")).toBeOnTheScreen();
    expect(screen.getByTestId("operationDetails-validator")).toHaveTextContent("aleo1validator");
    expect(screen.getByText("Staked amount")).toBeOnTheScreen();
    expect(screen.getByTestId("operationDetails-stakedAmount")).toHaveTextContent("1.5 ALEO");
  });

  it("renders unstaked amount without validator for an UNBOND operation", () => {
    const mockOperation: AleoOperation = {
      ...ALEO_ACCOUNT_1.operations[0],
      type: "UNBOND",
      extra: {
        functionId: "unbond_public",
        transactionType: "public",
        stakedAmount: new BigNumber(1500000),
      },
    };

    render(
      <OperationDetailsExtra account={ALEO_ACCOUNT_1} operation={mockOperation} type="UNBOND" />,
    );

    expect(screen.queryByTestId("operationDetails-validator")).not.toBeOnTheScreen();
    expect(screen.getByText("Unstaked amount")).toBeOnTheScreen();
    expect(screen.getByTestId("operationDetails-stakedAmount")).toHaveTextContent("1.5 ALEO");
  });

  it("does not render staked amount for operation types without a staked amount label", () => {
    const mockOperation: AleoOperation = {
      ...ALEO_ACCOUNT_1.operations[0],
      extra: {
        functionId: "transfer_public",
        transactionType: "public",
        stakedAmount: new BigNumber(1500000),
      },
    };

    render(<OperationDetailsExtra account={ALEO_ACCOUNT_1} operation={mockOperation} type="OUT" />);

    expect(screen.queryByTestId("operationDetails-stakedAmount")).not.toBeOnTheScreen();
  });
});

describe("operationStatusIcon", () => {
  it("renders a shield badge labeled Private for a private transaction", () => {
    const mockOperation: AleoOperation = {
      ...ALEO_ACCOUNT_1.operations[0],
      extra: { functionId: "transfer_private", transactionType: "private" },
    };

    render(<AleoOperationStatusIcon operation={mockOperation} confirmed type="OUT" size={40} />);

    expect(screen.getByLabelText("Private")).toBeOnTheScreen();
  });

  it("renders a globe badge labeled Public for a public transaction", () => {
    const mockOperation: AleoOperation = {
      ...ALEO_ACCOUNT_1.operations[0],
      extra: { functionId: "transfer_public", transactionType: "public" },
    };

    render(<AleoOperationStatusIcon operation={mockOperation} confirmed type="OUT" size={40} />);

    expect(screen.getByLabelText("Public")).toBeOnTheScreen();
  });

  it("renders no badge when transactionType is missing", () => {
    const mockOperation: AleoOperation = {
      ...ALEO_ACCOUNT_1.operations[0],
      extra: { functionId: "transfer_public" } as AleoOperation["extra"],
    };

    render(<AleoOperationStatusIcon operation={mockOperation} confirmed type="OUT" size={40} />);

    expect(screen.queryByLabelText(/Private|Public/)).not.toBeOnTheScreen();
  });
});
