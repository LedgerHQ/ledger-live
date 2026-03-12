import BigNumber from "bignumber.js";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getFormattedFeeFields } from "@ledgerhq/coin-evm/editTransaction/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getStuckAccountAndOperation } from "@ledgerhq/live-common/operation";
import React from "react";
import { render, screen } from "tests/testSetup";
import EditStuckTransactionPanelBodyHeader from "../EditStuckTransactionPanelBodyHeader";
import StepFees, { StepFeesFooter } from "../steps/StepFees";
import { StepSummaryFooter } from "../steps/StepSummaryFooter";
import type { StepProps } from "../types";

jest.mock("@ledgerhq/coin-evm/editTransaction/index", () => ({
  ...jest.requireActual("@ledgerhq/coin-evm/editTransaction/index"),
  getFormattedFeeFields: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/account/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/account/index"),
  getMainAccount: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/operation", () => ({
  ...jest.requireActual("@ledgerhq/live-common/operation"),
  getStuckAccountAndOperation: jest.fn(),
}));

jest.mock("~/renderer/components/SpeedUpCancel/SharedStepFees", () => ({
  SharedStepFees: ({
    pendingFeesInfoTitle,
    feeDetails,
  }: {
    pendingFeesInfoTitle: string;
    feeDetails: React.ReactNode;
  }) => (
    <div data-testid="shared-step-fees">
      <div>{pendingFeesInfoTitle}</div>
      <div>{feeDetails}</div>
    </div>
  ),
}));

jest.mock("~/renderer/components/SpeedUpCancel/SharedFooterContinueButton", () => ({
  SharedFooterContinueButton: ({
    onClick,
    disabled,
  }: {
    onClick: () => void;
    disabled: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      continue
    </button>
  ),
}));

jest.mock("~/renderer/components/BuyButton", () => ({
  __esModule: true,
  default: () => <div data-testid="buy-button" />,
}));

jest.mock("../components/TransactionErrorBanner", () => ({
  TransactionErrorBanner: ({ errors }: { errors?: Record<string, Error> }) => (
    <div data-testid="tx-error-banner">{Object.keys(errors || {}).join(",")}</div>
  ),
}));

jest.mock("~/renderer/components/SpeedUpCancel/SharedStepSummaryFooter", () => ({
  SharedStepSummaryFooter: ({
    onContinue,
    errors,
  }: {
    onContinue: () => void;
    errors: Record<string, Error>;
  }) => (
    <div>
      <button type="button" onClick={onContinue}>
        summary-continue
      </button>
      <span data-testid="summary-errors">{Object.keys(errors).length}</span>
    </div>
  ),
}));

jest.mock("~/renderer/components/SpeedUpCancel/SharedEditStuckTransactionPanelBodyHeader", () => ({
  SharedEditStuckTransactionPanelBodyHeader: ({
    isEditTxEnabled,
    isCurrencySupported,
    stuckAccountAndOperation,
  }: {
    isEditTxEnabled: boolean;
    isCurrencySupported: boolean;
    stuckAccountAndOperation: unknown;
  }) => (
    <div data-testid="shared-stuck-header">
      {String(isEditTxEnabled)}-{String(isCurrencySupported)}-{String(!!stuckAccountAndOperation)}
    </div>
  ),
}));

const account = genAccount("evm-edit-components-account");

const createStepProps = (overrides: Partial<StepProps> = {}): StepProps =>
  ({
    account,
    parentAccount: undefined,
    editType: "speedup",
    haveFundToSpeedup: true,
    haveFundToCancel: true,
    isOldestEditableOperation: true,
    setEditType: jest.fn(),
    t: (key: string, values?: Record<string, string>) =>
      values?.amount ? `${key}:${values.amount}` : key,
    transactionToUpdate: {
      amount: new BigNumber(1),
      recipient: "0xabc",
      type: 2,
    },
    transaction: {
      amount: new BigNumber(1),
      recipient: "0xabc",
    },
    transactionHasBeenValidated: false,
    updateTransaction: jest.fn(),
    transitionTo: jest.fn(),
    status: { errors: {} },
    bridgePending: false,
    device: null,
    error: null,
    optimisticOperation: null,
    signed: false,
    currencyName: "Ethereum",
    closeModal: jest.fn(),
    openModal: jest.fn(),
    onChangeTransaction: jest.fn(),
    onTransactionError: jest.fn(),
    onOperationBroadcasted: jest.fn(),
    onRetry: jest.fn(),
    setSigned: jest.fn(),
    ...overrides,
  }) as StepProps;

describe("EVM EditTransaction components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getMainAccount as jest.Mock).mockReturnValue({
      ...account,
      currency: { ...account.currency, family: "evm", id: "ethereum", ticker: "ETH" },
    });
  });

  it("StepFees renders EVM specific fee details for type 2 tx", () => {
    (getFormattedFeeFields as jest.Mock).mockReturnValue({
      formattedFeeValue: "1",
      formattedMaxPriorityFeePerGas: "2",
      formattedMaxFeePerGas: "3",
      formattedGasPrice: "4",
    });

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any
    render(<StepFees {...(createStepProps() as any)} />);

    expect(screen.getByTestId("shared-step-fees")).toBeInTheDocument();
    expect(
      screen.getByText("operation.edit.previousFeesInfo.maxPriorityFee:2"),
    ).toBeInTheDocument();
    expect(screen.getByText("operation.edit.previousFeesInfo.maxFee:3")).toBeInTheDocument();
  });

  it("StepFeesFooter shows BuyButton when gas fee errors exist", () => {
    const props = createStepProps({
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any
      status: { errors: { gasPrice: new Error("gas") } } as any,
    });

    render(<StepFeesFooter {...props} />);

    expect(screen.getByTestId("buy-button")).toBeInTheDocument();
  });

  it("StepSummaryFooter triggers transition to device", async () => {
    const transitionTo = jest.fn();
    const { user } = render(<StepSummaryFooter {...createStepProps({ transitionTo })} />);

    await user.click(screen.getByRole("button", { name: "summary-continue" }));

    expect(transitionTo).toHaveBeenCalledWith("device");
  });

  it("EditStuckTransactionPanelBodyHeader forwards feature/status to shared header", () => {
    (getStuckAccountAndOperation as jest.Mock).mockReturnValue({
      operation: {},
      account,
      parentAccount: undefined,
    });

    render(<EditStuckTransactionPanelBodyHeader account={account} parentAccount={undefined} />, {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            editEvmTx: {
              enabled: true,
              params: { supportedCurrencyIds: ["ethereum"] },
            },
          },
        },
      },
    });

    expect(screen.getByTestId("shared-stuck-header")).toHaveTextContent("true-true-true");
  });
});
