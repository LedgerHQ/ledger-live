import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import i18n from "~/renderer/i18n/init";
import type { StepProps } from "~/renderer/modals/Send/types";
import StepRecordPickerFooter from "./StepRecordPickerFooter";
import { ALEO_ACCOUNT_1 } from "../../../__mocks__/account.mock";
import { makeAleoTransaction } from "../../../__mocks__/transaction.mock";

jest.mock("~/renderer/modals/Send/AccountFooter", () => () => <div data-testid="account-footer" />);

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

describe("StepRecordPickerFooter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render null when account is null", () => {
    const { container } = render(<StepRecordPickerFooter {...defaultProps} account={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("should render AccountFooter and continue button", () => {
    render(<StepRecordPickerFooter {...defaultProps} />);

    expect(screen.getByTestId("account-footer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
  });

  it("should have the continue button enabled for a non-terminated currency", () => {
    render(<StepRecordPickerFooter {...defaultProps} />);

    expect(screen.getByRole("button", { name: /continue/i })).not.toBeDisabled();
  });

  it("should transition to amount step when continue is clicked", async () => {
    const transitionTo = jest.fn();
    const { user } = render(
      <StepRecordPickerFooter {...defaultProps} transitionTo={transitionTo} />,
    );

    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(transitionTo).toHaveBeenCalledWith("amount");
  });
});
