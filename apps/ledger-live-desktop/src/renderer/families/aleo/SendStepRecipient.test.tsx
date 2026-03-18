import React from "react";
import { render, screen } from "tests/testSetup";
import type { StepProps } from "~/renderer/modals/Send/types";
import { isSelfTransferTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import { makeAleoTransaction } from "./__mocks__/transaction.mock";
import SendStepRecipient from "./SendStepRecipient";

const mockIsSelfTransferTransaction = jest.mocked(isSelfTransferTransaction);

jest.mock("@ledgerhq/live-common/families/aleo/utils");

jest.mock("~/renderer/modals/Send/steps/StepRecipient", () => ({
  DefaultStepRecipient: () => <div data-testid="default-step-recipient" />,
}));

jest.mock("./SelfTransferModal/SelfTransferStepRecipient", () => ({
  SelfTransferStepRecipient: () => <div data-testid="self-transfer-step-recipient" />,
}));

describe("SendStepRecipient", () => {
  const mockTransaction = makeAleoTransaction();
  const baseProps = { transaction: mockTransaction } as unknown as StepProps;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders SelfTransferStepRecipient when isSelfTransferTransaction returns true", () => {
    mockIsSelfTransferTransaction.mockReturnValue(true);

    render(<SendStepRecipient {...baseProps} />);

    expect(screen.queryByTestId("self-transfer-step-recipient")).toBeInTheDocument();
    expect(screen.queryByTestId("default-step-recipient")).not.toBeInTheDocument();
  });

  it("renders DefaultStepRecipient when isSelfTransferTransaction returns false", () => {
    mockIsSelfTransferTransaction.mockReturnValue(false);

    render(<SendStepRecipient {...baseProps} />);

    expect(screen.queryByTestId("default-step-recipient")).toBeInTheDocument();
    expect(screen.queryByTestId("self-transfer-step-recipient")).not.toBeInTheDocument();
  });

  it("should render nothing when transaction family is not aleo", () => {
    const { container } = render(
      <SendStepRecipient
        {...baseProps}
        // @ts-expect-error - testing invalid family
        transaction={{ ...mockTransaction, family: "bitcoin" }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("should render nothing when transaction is null", () => {
    const { container } = render(<SendStepRecipient {...baseProps} transaction={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
