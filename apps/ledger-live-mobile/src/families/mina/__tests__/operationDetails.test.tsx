import React from "react";
import { render, screen } from "@tests/test-renderer";
import operationDetails from "../operationDetails";
import { createMockOperation } from "./testUtils";

const { OperationDetailsExtra } = operationDetails;

describe("OperationDetailsExtra", () => {
  it("renders nothing when there is no memo and no account creation fee", () => {
    const operation = createMockOperation({
      extra: { memo: undefined, accountCreationFee: "0" },
    });
    const { toJSON } = render(<OperationDetailsExtra operation={operation} />);

    expect(toJSON()).toBeNull();
  });

  it("displays memo when operation has a memo", () => {
    const operation = createMockOperation({
      extra: { memo: "test memo value", accountCreationFee: "0" },
    });
    render(<OperationDetailsExtra operation={operation} />);

    expect(screen.getByText("Memo")).toBeOnTheScreen();
    expect(screen.getByText("test memo value")).toBeOnTheScreen();
  });

  it("displays both memo and account creation fee when both present", () => {
    const operation = createMockOperation({
      extra: { memo: "payment for services", accountCreationFee: "1000000000" },
    });
    render(<OperationDetailsExtra operation={operation} />);

    expect(screen.getByText("Memo")).toBeOnTheScreen();
    expect(screen.getByText("payment for services")).toBeOnTheScreen();
    expect(screen.getByText("Account Creation Fee")).toBeOnTheScreen();
  });
});
