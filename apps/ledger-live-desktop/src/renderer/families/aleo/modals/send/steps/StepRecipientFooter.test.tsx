import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { isPrivateTransaction } from "@ledgerhq/live-common/families/aleo/utils";
import i18n from "~/renderer/i18n/init";
import type { StepProps } from "~/renderer/modals/Send/types";
import StepRecipientFooter from "./StepRecipientFooter";
import { ALEO_ACCOUNT_1 } from "../../../__mocks__/account.mock";
import { makeAleoTransaction } from "../../../__mocks__/transaction.mock";

jest.mock("@ledgerhq/live-common/families/aleo/utils");
jest.mock("~/renderer/modals/Send/AccountFooter", () => () => <div data-testid="account-footer" />);

const mockIsPrivateTransaction = jest.mocked(isPrivateTransaction);

const mockStatus: TransactionStatus = {
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(0),
  amount: new BigNumber(0),
  totalSpent: new BigNumber(0),
};

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
  transaction: makeAleoTransaction(),
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

describe("StepRecipientFooter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPrivateTransaction.mockReturnValue(false);
  });

  it("should render null when account is null", () => {
    const { container } = render(<StepRecipientFooter {...defaultProps} account={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("should render null when transaction is null", () => {
    const { container } = render(<StepRecipientFooter {...defaultProps} transaction={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("should render null when transaction family is not aleo", () => {
    const { container } = render(
      <StepRecipientFooter
        {...defaultProps}
        // @ts-expect-error - testing invalid family
        transaction={{ ...makeAleoTransaction(), family: "bitcoin" }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("should render AccountFooter and continue button", () => {
    render(<StepRecipientFooter {...defaultProps} />);

    expect(screen.getByTestId("account-footer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
  });

  it("should have the continue button enabled when there are no errors and not bridgePending", () => {
    render(<StepRecipientFooter {...defaultProps} bridgePending={false} />);

    expect(screen.getByRole("button", { name: /continue/i })).not.toBeDisabled();
  });

  it("should disable the continue button when bridgePending is true", () => {
    render(<StepRecipientFooter {...defaultProps} bridgePending={true} />);

    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("should disable the continue button when there is a recipient error", () => {
    render(
      <StepRecipientFooter
        {...defaultProps}
        status={{ ...mockStatus, errors: { recipient: new Error("Invalid recipient") } }}
      />,
    );

    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("should disable the continue button when there is a sender error", () => {
    render(
      <StepRecipientFooter
        {...defaultProps}
        status={{ ...mockStatus, errors: { sender: new Error("Invalid sender") } }}
      />,
    );

    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("should transition to private-sync step when transaction is private and continue is clicked", async () => {
    mockIsPrivateTransaction.mockReturnValue(true);
    const transitionTo = jest.fn();
    const { user } = render(<StepRecipientFooter {...defaultProps} transitionTo={transitionTo} />);

    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(transitionTo).toHaveBeenCalledWith("private-sync");
  });

  it("should transition to amount step when transaction is public and continue is clicked", async () => {
    mockIsPrivateTransaction.mockReturnValue(false);
    const transitionTo = jest.fn();
    const { user } = render(<StepRecipientFooter {...defaultProps} transitionTo={transitionTo} />);

    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(transitionTo).toHaveBeenCalledWith("amount");
  });
});
