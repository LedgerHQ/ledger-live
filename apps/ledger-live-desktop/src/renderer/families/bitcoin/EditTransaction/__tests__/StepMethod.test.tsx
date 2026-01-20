import BigNumber from "bignumber.js";
import { getEditTransactionPatch } from "@ledgerhq/coin-bitcoin/editTransaction/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import StepMethod, { StepMethodFooter } from "../steps/StepMethod";
import type { StepProps } from "../types";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

jest.mock("~/renderer/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: (url: string) => url,
}));

jest.mock("@ledgerhq/coin-bitcoin/editTransaction/index", () => ({
  ...jest.requireActual("@ledgerhq/coin-bitcoin/editTransaction/index"),
  getEditTransactionPatch: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/account/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/account/index"),
  getMainAccount: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/bridge/index"),
  getAccountBridge: jest.fn(),
}));

jest.mock("../components/TransactionErrorBanner", () => ({
  TransactionErrorBanner: () => null,
}));

const account = genAccount("bitcoin-step-method-account");

const createProps = (overrides: Partial<StepProps> = {}): StepProps =>
  ({
    account,
    parentAccount: undefined,
    editType: "speedup",
    haveFundToSpeedup: true,
    haveFundToCancel: true,
    isOldestEditableOperation: true,
    setEditType: jest.fn(),
    t: (key: string) => key,
    transactionToUpdate: { amount: new BigNumber(1), recipient: "bc1qtest" },
    transactionHasBeenValidated: false,
    updateTransaction: jest.fn(),
    transitionTo: jest.fn(),
    status: { errors: {} },
    bridgePending: false,
    device: null,
    transaction: { amount: new BigNumber(1), recipient: "bc1qtest" },
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

describe("Bitcoin EditTransaction StepMethod", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getMainAccount as jest.Mock).mockReturnValue({
      ...account,
      currency: { ...account.currency, ticker: "BTC", family: "bitcoin" },
    });
  });

  it("opens Bitcoin learn more link", async () => {
    const props = createProps();
    const { user } = render(<StepMethod {...props} />);

    await user.click(screen.getByText("operation.edit.learnMore"));

    expect(openURL).toHaveBeenCalledWith(urls.editBitcoinTx.learnMore);
  });

  it("calls Bitcoin patch flow and transitions on continue", async () => {
    const bridgeUpdateTransaction = jest.fn();
    const tx = createProps().transactionToUpdate;
    const updateTransaction: StepProps["updateTransaction"] = updater => {
      updater(tx);
    };
    const transitionTo = jest.fn();
    const patch = { feePerByte: new BigNumber(15) };

    (getAccountBridge as jest.Mock).mockReturnValue({
      updateTransaction: bridgeUpdateTransaction,
    });
    (getEditTransactionPatch as jest.Mock).mockResolvedValue(patch);

    const props = createProps({ updateTransaction, transitionTo, editType: "cancel" });
    const { user } = render(<StepMethodFooter {...props} />);

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(getEditTransactionPatch).toHaveBeenCalledWith({
        editType: "cancel",
        transaction: props.transactionToUpdate,
        account: expect.any(Object),
      });
      expect(bridgeUpdateTransaction).toHaveBeenCalledWith(tx, patch);
      expect(transitionTo).toHaveBeenCalledWith("summary");
    });
  });
  it("calls Bitcoin patch flow and transitions on continue with speedup", async () => {
    const bridgeUpdateTransaction = jest.fn();
    const tx = createProps().transactionToUpdate;
    const updateTransaction: StepProps["updateTransaction"] = updater => {
      updater(tx);
    };
    const transitionTo = jest.fn();
    const patch = { feePerByte: new BigNumber(15) };

    (getAccountBridge as jest.Mock).mockReturnValue({
      updateTransaction: bridgeUpdateTransaction,
    });
    (getEditTransactionPatch as jest.Mock).mockResolvedValue(patch);

    const props = createProps({ updateTransaction, transitionTo, editType: "speedup" });
    const { user } = render(<StepMethodFooter {...props} />);

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(getEditTransactionPatch).toHaveBeenCalledWith({
        editType: "speedup",
        transaction: props.transactionToUpdate,
        account: expect.any(Object),
      });
      expect(bridgeUpdateTransaction).toHaveBeenCalledWith(tx, patch);
      expect(transitionTo).toHaveBeenCalledWith("summary");
    });
  });
});
