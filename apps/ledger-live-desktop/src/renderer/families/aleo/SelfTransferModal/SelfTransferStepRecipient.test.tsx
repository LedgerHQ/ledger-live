import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import i18n from "~/renderer/i18n/init";
import { trackPage } from "~/renderer/analytics/segment";
import type { StepProps } from "~/renderer/modals/Send/types";
import { SelfTransferStepRecipient } from "./SelfTransferStepRecipient";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";

describe("SelfTransferStepRecipient", () => {
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
    transaction: null,
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
  });

  it("should display the TODO placeholder text", () => {
    render(<SelfTransferStepRecipient {...defaultProps} />);

    expect(
      screen.getByText("TODO: add proper components and balance selector"),
    ).toBeInTheDocument();
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
});
