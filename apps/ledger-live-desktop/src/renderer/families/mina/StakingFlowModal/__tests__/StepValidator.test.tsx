import React from "react";
import { render, screen } from "tests/testSetup";
import StepValidator, { StepValidatorFooter } from "../steps/StepValidator";
import {
  createMockStepProps,
  createMockMinaAccount,
  createDelegatingMinaAccount,
  createMockTransaction,
  mockValidators,
} from "../../__tests__/testUtils";

jest.mock("~/renderer/analytics/TrackPage", () => {
  return function MockTrackPage() {
    return null;
  };
});

jest.mock("~/renderer/modals/Send/AccountFooter", () => {
  return function MockAccountFooter() {
    return null;
  };
});

describe("StepValidator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when transaction is null", () => {
    const props = createMockStepProps({ transaction: null });
    const { container } = render(<StepValidator {...props} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when account is null", () => {
    const props = createMockStepProps({ account: null });
    const { container } = render(<StepValidator {...props} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the validator list when account and transaction are provided", () => {
    const props = createMockStepProps();
    render(<StepValidator {...props} />);
    expect(screen.getByTestId("validator-list")).toBeInTheDocument();
  });

  it("renders error banner when error is provided", () => {
    const props = createMockStepProps({ error: new Error("Test error") });
    render(<StepValidator {...props} />);
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });
});

describe("StepValidatorFooter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when account is null", () => {
    const props = createMockStepProps({ account: null });
    const { container } = render(<StepValidatorFooter {...props} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders cancel and continue buttons", () => {
    const props = createMockStepProps();
    render(<StepValidatorFooter {...props} />);

    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Continue")).toBeInTheDocument();
  });

  it("continue button is disabled when no recipient is selected", () => {
    const transaction = createMockTransaction({ recipient: "" });
    const props = createMockStepProps({ transaction });

    render(<StepValidatorFooter {...props} />);

    const continueBtn = document.getElementById("stake-continue-button");
    expect(continueBtn).toBeDisabled();
  });

  it("continue button is disabled when recipient is the same as current delegate", () => {
    const account = createDelegatingMinaAccount(mockValidators[0]);
    const transaction = createMockTransaction({
      recipient: mockValidators[0].address,
    });
    const props = createMockStepProps({ account, transaction });

    render(<StepValidatorFooter {...props} />);

    const continueBtn = document.getElementById("stake-continue-button");
    expect(continueBtn).toBeDisabled();
  });

  it("continue button is enabled when recipient is different from current delegate", () => {
    const account = createDelegatingMinaAccount(mockValidators[0]);
    const transaction = createMockTransaction({
      recipient: mockValidators[1].address,
    });
    const props = createMockStepProps({ account, transaction });

    render(<StepValidatorFooter {...props} />);

    const continueBtn = document.getElementById("stake-continue-button");
    expect(continueBtn).not.toBeDisabled();
  });

  it("continue button is enabled when account has no current delegate and recipient is set", () => {
    const account = createMockMinaAccount();
    const transaction = createMockTransaction({
      recipient: mockValidators[0].address,
    });
    const props = createMockStepProps({ account, transaction });

    render(<StepValidatorFooter {...props} />);

    const continueBtn = document.getElementById("stake-continue-button");
    expect(continueBtn).not.toBeDisabled();
  });

  it("calls onClose when cancel button is clicked", async () => {
    const props = createMockStepProps();
    const { user } = render(<StepValidatorFooter {...props} />);

    await user.click(screen.getByText("Cancel"));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("transitions to connectDevice when continue button is clicked", async () => {
    const account = createMockMinaAccount();
    const transaction = createMockTransaction({
      recipient: mockValidators[0].address,
    });
    const props = createMockStepProps({ account, transaction });
    const { user } = render(<StepValidatorFooter {...props} />);

    const continueBtn = document.getElementById("stake-continue-button");
    await user.click(continueBtn!);

    expect(props.transitionTo).toHaveBeenCalledWith("connectDevice");
  });
});
