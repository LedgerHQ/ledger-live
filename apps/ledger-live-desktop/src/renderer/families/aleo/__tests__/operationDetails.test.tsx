import React from "react";
import { render, screen } from "tests/testSetup";
import type { AleoOperation } from "@ledgerhq/live-common/families/aleo/types";
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
