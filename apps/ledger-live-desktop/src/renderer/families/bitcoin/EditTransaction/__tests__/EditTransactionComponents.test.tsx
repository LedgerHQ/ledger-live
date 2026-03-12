import BigNumber from "bignumber.js";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getFormattedFeeFields } from "@ledgerhq/coin-bitcoin/editTransaction/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getStuckAccountAndOperation } from "@ledgerhq/coin-bitcoin/operation";
import React from "react";
import { render, screen } from "tests/testSetup";
import EditStuckTransactionPanelBodyHeader from "../EditStuckTransactionPanelBodyHeader";
import StepFees, { StepFeesFooter } from "../steps/StepFees";
import { StepSummaryFooter } from "../steps/StepSummaryFooter";
import type { StepProps } from "../types";

jest.mock("@ledgerhq/coin-bitcoin/editTransaction/index", () => ({
  ...jest.requireActual("@ledgerhq/coin-bitcoin/editTransaction/index"),
  getFormattedFeeFields: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/account/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/account/index"),
  getMainAccount: jest.fn(),
}));

jest.mock("@ledgerhq/coin-bitcoin/operation", () => ({
  ...jest.requireActual("@ledgerhq/coin-bitcoin/operation"),
  getStuckAccountAndOperation: jest.fn(),
}));

jest.mock("~/renderer/modals/Send/SendAmountFields", () => ({
  __esModule: true,
  default: () => <div data-testid="send-amount-fields" />,
}));

jest.mock("../components/TransactionErrorBanner", () => ({
  TransactionErrorBanner: ({ errors }: { errors?: Record<string, Error> }) => (
    <div data-testid="tx-error-banner">{Object.keys(errors || {}).join(",")}</div>
  ),
}));

jest.mock("~/renderer/components/OperationsList/EditOperationPanel", () => ({
  __esModule: true,
  default: () => <div data-testid="edit-operation-panel" />,
}));

const account = genAccount("bitcoin-edit-components-account");

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
      recipient: "bc1qtest",
    },
    transaction: {
      amount: new BigNumber(1),
      recipient: "bc1qtest",
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
    currencyName: "Bitcoin",
    closeModal: jest.fn(),
    openModal: jest.fn(),
    onChangeTransaction: jest.fn(),
    onTransactionError: jest.fn(),
    onOperationBroadcasted: jest.fn(),
    onRetry: jest.fn(),
    setSigned: jest.fn(),
    ...overrides,
  }) as StepProps;

describe("Bitcoin EditTransaction components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getMainAccount as jest.Mock).mockReturnValue({
      ...account,
      currency: { ...account.currency, family: "bitcoin", id: "bitcoin", ticker: "BTC" },
    });
  });

  it("StepFees renders formatted network fee info", () => {
    (getFormattedFeeFields as jest.Mock).mockReturnValue({
      formattedFeeValue: "12",
    });

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any
    render(<StepFees {...(createStepProps() as any)} />);

    expect(screen.getByText("operation.edit.previousFeesInfo.networkfee:12")).toBeInTheDocument();
    expect(screen.getByTestId("send-amount-fields")).toBeInTheDocument();
  });

  it("StepFeesFooter renders banner for replacement underpriced errors", () => {
    const props = createStepProps({
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any
      status: { errors: { replacementTransactionUnderpriced: new Error("rbf") } } as any,
    });

    render(<StepFeesFooter {...props} />);

    expect(screen.getByTestId("tx-error-banner")).toHaveTextContent(
      "replacementTransactionUnderpriced",
    );
  });

  it("StepSummaryFooter triggers transition to device", async () => {
    const transitionTo = jest.fn();
    const { user } = render(<StepSummaryFooter {...createStepProps({ transitionTo })} />);

    await user.click(screen.getByRole("button"));

    expect(transitionTo).toHaveBeenCalledWith("device");
  });

  it("EditStuckTransactionPanelBodyHeader renders panel when enabled and stuck tx exists", () => {
    (getStuckAccountAndOperation as jest.Mock).mockReturnValue({
      operation: {},
      account,
      parentAccount: undefined,
    });

    render(<EditStuckTransactionPanelBodyHeader account={account} parentAccount={undefined} />, {
      initialState: {
        settings: {
          overriddenFeatureFlags: {
            editBitcoinTx: {
              enabled: true,
              params: { supportedCurrencyIds: ["bitcoin"] },
            },
          },
        },
      },
    });

    expect(screen.getByTestId("edit-operation-panel")).toBeInTheDocument();
  });
});
