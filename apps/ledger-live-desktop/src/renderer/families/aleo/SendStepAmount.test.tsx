import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import type {
  AleoAccount,
  TransactionPrivate,
  TransactionStatus,
} from "@ledgerhq/live-common/families/aleo/types";
import i18n from "~/renderer/i18n/init";
import type { StepProps } from "~/renderer/modals/Send/types";
import SendStepAmount from "./SendStepAmount";
import { ALEO_ACCOUNT_1 } from "./__mocks__/account.mock";
import { makeAleoTransaction } from "./__mocks__/transaction.mock";

jest.mock("~/renderer/modals/Send/steps/StepAmount", () => ({
  DefaultStepAmount: () => <div data-testid="default-step-amount" />,
}));

jest.mock("./shared/StepRecordPicker", () => ({
  StepRecordPicker: () => <div data-testid="step-record-picker" />,
}));

describe("SendStepAmount", () => {
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

  it("should return null when transaction is null", () => {
    const { container } = render(<SendStepAmount {...defaultProps} transaction={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("should render DefaultStepAmount for public aleo transactions", () => {
    const publicTransaction = makeAleoTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PUBLIC });
    render(<SendStepAmount {...defaultProps} transaction={publicTransaction} />);

    expect(screen.getByTestId("default-step-amount")).toBeInTheDocument();
  });

  describe("private transactions", () => {
    const privateTransaction: TransactionPrivate = {
      family: "aleo",
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      recipient: "",
      amount: new BigNumber(0),
      fees: new BigNumber(0),
      useAllAmount: false,
      amountRecord: null,
      feeRecord: null,
    };

    it("should render StepRecordPicker when account has aleoResources", () => {
      const aleoAccount: AleoAccount = {
        ...ALEO_ACCOUNT_1,
        aleoResources: {
          transparentBalance: new BigNumber(0),
          privateBalance: new BigNumber(0),
          unspentPrivateRecords: [],
          provableApi: null,
          lastPrivateSyncDate: null,
        },
      };

      render(
        <SendStepAmount {...defaultProps} account={aleoAccount} transaction={privateTransaction} />,
      );

      expect(screen.getByTestId("step-record-picker")).toBeInTheDocument();
    });

    it("should return null when account does not have aleoResources", () => {
      const { container } = render(
        <SendStepAmount
          {...defaultProps}
          account={ALEO_ACCOUNT_1}
          transaction={privateTransaction}
        />,
      );

      expect(container).toBeEmptyDOMElement();
    });
  });
});
