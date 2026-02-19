import React from "react";
import { render, screen } from "tests/testSetup";
import StepConfirmation, { StepConfirmationFooter } from "../steps/StepConfirmation";
import {
  createMockStepProps,
  createMockOperation,
  createMockTransaction,
  mockValidators,
} from "../../__tests__/testUtils";
import { track } from "~/renderer/analytics/segment";

jest.mock("~/renderer/analytics/segment");

jest.mock("~/renderer/analytics/TrackPage", () => {
  return function MockTrackPage() {
    return null;
  };
});

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  SyncOneAccountOnMount: () => null,
}));

jest.mock("~/renderer/drawers/OperationDetails", () => ({
  OperationDetails: () => null,
}));

describe("StepConfirmation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when there is no operation and no error", () => {
    const props = createMockStepProps();
    const { container } = render(<StepConfirmation {...props} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders success display when optimisticOperation is provided", () => {
    const operation = createMockOperation();
    const transaction = createMockTransaction({
      recipient: mockValidators[0].address,
    });
    const props = createMockStepProps({
      optimisticOperation: operation,
      transaction,
    });

    render(<StepConfirmation {...props} />);

    expect(screen.getByText("Transaction successfully broadcasted")).toBeInTheDocument();
    expect(
      screen.getByText("Your delegation change request has been broadcasted."),
    ).toBeInTheDocument();
  });

  it("tracks staking_completed when operation is successful", () => {
    const operation = createMockOperation();
    const transaction = createMockTransaction({
      recipient: mockValidators[0].address,
    });
    const props = createMockStepProps({
      optimisticOperation: operation,
      transaction,
      source: "Account Page",
    });

    render(<StepConfirmation {...props} />);

    expect(track).toHaveBeenCalledWith("staking_completed", {
      currency: "MINA",
      validator: mockValidators[0].address,
      source: "Account Page",
      delegation: "delegation",
      flow: "stake",
    });
  });

  it("renders error display when error is provided", () => {
    const error = new Error("Transaction failed");
    const props = createMockStepProps({ error });

    render(<StepConfirmation {...props} />);

    expect(screen.getByText(/Transaction failed/)).toBeInTheDocument();
  });

  it("shows broadcast error disclaimer when error occurs after signing", () => {
    const error = new Error("Broadcast failed");
    const props = createMockStepProps({ error, signed: true });

    render(<StepConfirmation {...props} />);

    expect(
      screen.getByText("An error occurred while broadcasting the transaction"),
    ).toBeInTheDocument();
  });

  it("does not show broadcast error disclaimer when error occurs before signing", () => {
    const error = new Error("Pre-sign error");
    const props = createMockStepProps({ error, signed: false });

    render(<StepConfirmation {...props} />);

    expect(
      screen.queryByText("An error occurred while broadcasting the transaction"),
    ).not.toBeInTheDocument();
  });
});

describe("StepConfirmationFooter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders close button", () => {
    const props = createMockStepProps();
    render(<StepConfirmationFooter {...props} />);

    expect(screen.getByTestId("modal-close-button")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const props = createMockStepProps();
    const { user } = render(<StepConfirmationFooter {...props} />);

    await user.click(screen.getByTestId("modal-close-button"));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("renders second close button when operation exists", () => {
    const operation = createMockOperation();
    const props = createMockStepProps({
      optimisticOperation: operation,
    });

    render(<StepConfirmationFooter {...props} />);

    const buttons = screen.getAllByText("Close");
    expect(buttons).toHaveLength(2);
  });

  it("renders retry button when there is an error", () => {
    const props = createMockStepProps({
      error: new Error("Failed"),
    });

    render(<StepConfirmationFooter {...props} />);

    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const props = createMockStepProps({
      error: new Error("Failed"),
    });
    const { user } = render(<StepConfirmationFooter {...props} />);

    await user.click(screen.getByRole("button", { name: /retry/i }));

    expect(props.onRetry).toHaveBeenCalled();
  });
});
