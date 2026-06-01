import BigNumber from "bignumber.js";
import { getEditTransactionPatch } from "@ledgerhq/coin-bitcoin/editTransaction/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
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

jest.mock("@ledgerhq/live-common/bridge/index", () => {
  const actual = jest.requireActual<Record<PropertyKey, unknown>>(
    "@ledgerhq/live-common/bridge/index",
  );
  const overrides: Record<PropertyKey, unknown> = { __esModule: true, getAccountBridge: jest.fn() };
  return new Proxy(overrides, { get: (o, k) => (k in o ? o[k] : actual[k]) });
});

jest.mock("../components/TransactionErrorBanner", () => ({
  TransactionErrorBanner: () => null,
}));

const account = genAccount("bitcoin-step-method-account", {
  currency: getCryptoCurrencyById("bitcoin"),
});

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

    const bridge = { updateTransaction: bridgeUpdateTransaction };
    (getAccountBridge as jest.Mock).mockReturnValue(
      Object.assign(Promise.resolve(bridge), { status: "fulfilled", value: bridge }),
    );
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

    const bridge2 = { updateTransaction: bridgeUpdateTransaction };
    (getAccountBridge as jest.Mock).mockReturnValue(
      Object.assign(Promise.resolve(bridge2), { status: "fulfilled", value: bridge2 }),
    );
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
