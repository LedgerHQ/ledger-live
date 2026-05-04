import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import i18n from "~/renderer/i18n/init";
import { trackPage } from "~/renderer/analytics/segment";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import type { StepProps } from "~/renderer/modals/Send/types";
import { AleoSendStepRecipient } from "./AleoSendStepRecipient";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import { makeAleoTransaction } from "../__mocks__/transaction.mock";

jest.mock("~/renderer/hooks/useAccountUnit");
jest.mock("~/renderer/modals/Send/fields/RecipientField", () => ({
  __esModule: true,
  default: () => <div data-testid="recipient-field" />,
}));
jest.mock("~/renderer/modals/Send/SendRecipientFields", () => ({
  __esModule: true,
  default: () => <div data-testid="send-recipient-fields" />,
  getFields: jest.fn(() => []),
}));

const mockUseAccountUnit = jest.mocked(useAccountUnit);

describe("AleoSendStepRecipient", () => {
  const mockStatus: TransactionStatus = {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  };

  const aleoTransaction = makeAleoTransaction({
    mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
  });

  const defaultProps: StepProps = {
    t: i18n.t.bind(i18n),
    account: ALEO_ACCOUNT_1,
    parentAccount: null,
    openedFromAccount: false,
    onChangeAccount: jest.fn(),
    error: null,
    status: mockStatus,
    currencyName: "Aleo",
    transitionTo: jest.fn(),
    device: null,
    transaction: aleoTransaction,
    bridgePending: false,
    optimisticOperation: null,
    closeModal: jest.fn(),
    openModal: jest.fn(),
    onChangeTransaction: jest.fn(),
    onTransactionError: jest.fn(),
    onOperationBroadcasted: jest.fn(),
    onRetry: jest.fn(),
    setSigned: jest.fn(),
    signed: false,
    onResetMaybeRecipient: jest.fn(),
    onResetMaybeAmount: jest.fn(),
    updateTransaction: jest.fn(),
    onConfirmationHandler: jest.fn(),
    onFailHandler: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccountUnit.mockReturnValue({
      code: "ALEO",
      name: "Aleo",
      magnitude: 6,
    });
  });

  it("should return null when transaction is null", () => {
    const { container } = render(<AleoSendStepRecipient {...defaultProps} transaction={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("should return null when status is null", () => {
    const { container } = render(
      // @ts-expect-error - testing missing status
      <AleoSendStepRecipient {...defaultProps} status={null} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("should return null when account is null", () => {
    const { container } = render(<AleoSendStepRecipient {...defaultProps} account={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("should return null when transaction family is not aleo", () => {
    const { container } = render(
      <AleoSendStepRecipient
        {...defaultProps}
        // @ts-expect-error - testing invalid family
        transaction={{ ...aleoTransaction, family: "bitcoin" }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("should track the Aleo Send Flow Recipient Step analytics page", () => {
    render(<AleoSendStepRecipient {...defaultProps} />);

    expect(trackPage).toHaveBeenCalledWith(
      "Aleo Send Flow",
      "Step Recipient",
      expect.objectContaining({ currencyName: "Aleo" }),
      true,
      true,
      false,
    );
  });

  it("should render the account selector label", () => {
    render(<AleoSendStepRecipient {...defaultProps} />);

    expect(screen.getByText("Account to debit")).toBeInTheDocument();
  });

  it("should render the balance selector with public and private options", () => {
    render(<AleoSendStepRecipient {...defaultProps} />);

    expect(screen.getByText(/Public balance/)).toBeInTheDocument();
    expect(screen.getByText(/Private balance/)).toBeInTheDocument();
  });

  it("should render the recipient field and extra recipient fields", () => {
    render(<AleoSendStepRecipient {...defaultProps} />);

    expect(screen.getByTestId("recipient-field")).toBeInTheDocument();
    expect(screen.getByTestId("send-recipient-fields")).toBeInTheDocument();
  });

  it("should render an error banner when error is provided", () => {
    const error = new Error("Something went wrong");
    render(<AleoSendStepRecipient {...defaultProps} error={error} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("should render a sender error banner when status.errors.sender is set", () => {
    const senderError = new Error("Sender error");
    const statusWithSenderError: TransactionStatus = {
      ...mockStatus,
      errors: { sender: senderError },
    };

    render(<AleoSendStepRecipient {...defaultProps} status={statusWithSenderError} />);

    expect(screen.getByTestId("sender-error-container")).toBeInTheDocument();
  });

  it("should call updateTransaction with TRANSFER_PRIVATE when switching to private balance", async () => {
    const updateTransaction = jest.fn();
    const { user } = render(
      <AleoSendStepRecipient {...defaultProps} updateTransaction={updateTransaction} />,
    );

    const privateOption = screen.getByText(/Private balance/);
    await user.click(privateOption);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    const updaterFn = updateTransaction.mock.calls[0][0];
    const result = updaterFn(aleoTransaction);
    expect(result.mode).toBe(TRANSACTION_TYPE.TRANSFER_PRIVATE);
    expect(result.properties).toEqual({ amountRecordCommitments: [], feeRecordCommitment: null });
  });

  it("should call updateTransaction with TRANSFER_PUBLIC when switching to public balance", async () => {
    const privateTransaction = makeAleoTransaction({
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
    });
    const updateTransaction = jest.fn();
    const { user } = render(
      <AleoSendStepRecipient
        {...defaultProps}
        transaction={privateTransaction}
        updateTransaction={updateTransaction}
      />,
    );

    const publicOption = screen.getByText(/Public balance/);
    await user.click(publicOption);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    const updaterFn = updateTransaction.mock.calls[0][0];
    const result = updaterFn(privateTransaction);
    expect(result.mode).toBe(TRANSACTION_TYPE.TRANSFER_PUBLIC);

    expect(result).not.toHaveProperty("properties");
  });
});
