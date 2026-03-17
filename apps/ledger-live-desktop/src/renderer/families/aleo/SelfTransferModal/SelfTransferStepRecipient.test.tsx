import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import i18n from "~/renderer/i18n/init";
import { trackPage } from "~/renderer/analytics/segment";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import type { StepProps } from "~/renderer/modals/Send/types";
import { SelfTransferStepRecipient } from "./SelfTransferStepRecipient";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import { makeAleoTransaction } from "../__mocks__/transaction.mock";

jest.mock("~/renderer/hooks/useAccountUnit");

const mockUseAccountUnit = jest.mocked(useAccountUnit);

describe("SelfTransferStepRecipient", () => {
  const mockStatus: TransactionStatus = {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  };

  const aleoTransaction = makeAleoTransaction({
    mode: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE,
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

  it("should return null when the transaction is null", () => {
    const { container } = render(
      <SelfTransferStepRecipient {...defaultProps} transaction={null} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("should track the Self Transfer Recipient Step analytics page", () => {
    render(<SelfTransferStepRecipient {...defaultProps} />);

    expect(trackPage).toHaveBeenCalledWith(
      "Aleo Self Transfer Flow",
      "Step Recipient",
      expect.objectContaining({ currencyName: "Aleo" }),
      true,
      true,
    );
  });

  it("should render the account selector label and the balance selector", () => {
    render(<SelfTransferStepRecipient {...defaultProps} />);

    expect(screen.getByText("Transfer from")).toBeInTheDocument();
    expect(screen.getByText(/Public balance/)).toBeInTheDocument();
    expect(screen.getByText(/Private balance/)).toBeInTheDocument();
  });

  it("should call updateTransaction with CONVERT_PRIVATE_TO_PUBLIC when balance selector switches to private", async () => {
    const updateTransaction = jest.fn();
    const { user } = render(
      <SelfTransferStepRecipient {...defaultProps} updateTransaction={updateTransaction} />,
    );

    const switchButton = screen.getByRole("button", { name: /switch balance source/i });
    await user.click(switchButton);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    const updaterFn = updateTransaction.mock.calls[0][0];
    const result = updaterFn(aleoTransaction);
    expect(result.mode).toBe(TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC);
    expect(result.properties).toEqual({ amountRecordCommitment: null, feeRecordCommitment: null });
  });

  it("should call updateTransaction with CONVERT_PUBLIC_TO_PRIVATE when balance selector switches to public", async () => {
    const convertPrivateToPublicTransaction = makeAleoTransaction({
      mode: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
    });
    const updateTransaction = jest.fn();
    const { user } = render(
      <SelfTransferStepRecipient
        {...defaultProps}
        transaction={convertPrivateToPublicTransaction}
        updateTransaction={updateTransaction}
      />,
    );

    const switchButton = screen.getByRole("button", { name: /switch balance source/i });
    await user.click(switchButton);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    const updaterFn = updateTransaction.mock.calls[0][0];
    const result = updaterFn(convertPrivateToPublicTransaction);
    expect(result.mode).toBe(TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE);
  });
});
