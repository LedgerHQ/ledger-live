import React from "react";
import { render, screen } from "tests/testSetup";
import type { StepProps } from "~/renderer/modals/Send/types";
import { isSelfTransferTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import { makeAleoTransaction } from "../../../__mocks__/transaction.mock";
import StepRecipient from "./StepRecipient";
import { useAccountChangeGuard } from "./useAccountChangeGuard";

const mockIsSelfTransferTransaction = jest.mocked(isSelfTransferTransaction);
const mockUseAccountChangeGuard = jest.mocked(useAccountChangeGuard);

jest.mock("@ledgerhq/live-common/families/aleo/utils");
jest.mock("./useAccountChangeGuard");

jest.mock("../../../SendTransferModal/AleoSendStepRecipient", () => ({
  AleoSendStepRecipient: ({ onChangeAccount }: { onChangeAccount: () => void }) => (
    <div data-testid="aleo-send-step-recipient">
      <button data-testid="change-account-btn" onClick={onChangeAccount} />
    </div>
  ),
}));

jest.mock("../../../SelfTransferModal/SelfTransferStepRecipient", () => ({
  SelfTransferStepRecipient: ({ onChangeAccount }: { onChangeAccount: () => void }) => (
    <div data-testid="self-transfer-step-recipient">
      <button data-testid="change-account-btn" onClick={onChangeAccount} />
    </div>
  ),
}));

describe("SendStepRecipient", () => {
  const mockTransaction = makeAleoTransaction();
  const mockOnChangeAccount = jest.fn();
  const mockUpdateTransaction = jest.fn();
  const mockSafeOnChangeAccount = jest.fn();

  const baseProps = {
    transaction: mockTransaction,
    onChangeAccount: mockOnChangeAccount,
    updateTransaction: mockUpdateTransaction,
  } as unknown as StepProps;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccountChangeGuard.mockReturnValue(mockSafeOnChangeAccount);
  });

  it("renders SelfTransferStepRecipient when isSelfTransferTransaction returns true", () => {
    mockIsSelfTransferTransaction.mockReturnValue(true);

    render(<StepRecipient {...baseProps} />);

    expect(screen.queryByTestId("self-transfer-step-recipient")).toBeInTheDocument();
    expect(screen.queryByTestId("aleo-send-step-recipient")).not.toBeInTheDocument();
  });

  it("renders AleoSendStepRecipient when isSelfTransferTransaction returns false", () => {
    mockIsSelfTransferTransaction.mockReturnValue(false);

    render(<StepRecipient {...baseProps} />);

    expect(screen.queryByTestId("aleo-send-step-recipient")).toBeInTheDocument();
    expect(screen.queryByTestId("self-transfer-step-recipient")).not.toBeInTheDocument();
  });

  it("should render nothing when transaction family is not aleo", () => {
    const { container } = render(
      <StepRecipient
        {...baseProps}
        // @ts-expect-error - testing invalid family
        transaction={{ ...mockTransaction, family: "bitcoin" }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("should render nothing when transaction is null", () => {
    const { container } = render(<StepRecipient {...baseProps} transaction={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("initialises useAccountChangeGuard with onChangeAccount and updateTransaction", () => {
    mockIsSelfTransferTransaction.mockReturnValue(false);

    render(<StepRecipient {...baseProps} />);

    expect(mockUseAccountChangeGuard).toHaveBeenCalledWith(
      mockOnChangeAccount,
      mockUpdateTransaction,
    );
  });

  it("passes the guarded onChangeAccount to the child component", () => {
    mockIsSelfTransferTransaction.mockReturnValue(false);

    render(<StepRecipient {...baseProps} />);

    screen.getByTestId("change-account-btn").click();

    expect(mockSafeOnChangeAccount).toHaveBeenCalledTimes(1);
    expect(mockOnChangeAccount).not.toHaveBeenCalled();
  });
});
