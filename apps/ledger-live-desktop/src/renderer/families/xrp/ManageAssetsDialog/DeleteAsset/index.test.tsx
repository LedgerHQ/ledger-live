import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import {
  XrpOptOutTokenInEscrow,
  type XrpTokenAccount,
} from "@ledgerhq/live-common/families/xrp/types";
import type { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import { DeleteAsset } from "./index";
import {
  XRP_ACCOUNT,
  XRP_MPT_TOKEN_ACCOUNT,
  makeXrpTokenAccount,
} from "../../__mocks__/account.mock";

const mockBroadcast = jest.fn<Promise<Operation>, [SignedOperation]>();
const mockSignedInput = jest.fn();
const mockNavigate = jest.fn();
const mockUseBridgeTransaction = jest.fn();
const mockUpdateAccount = jest.fn();
const mockUpdateTransaction = jest.fn();
const mockStatus = { errors: {} as Record<string, Error>, warnings: {} };
const mockBridge: { pending: boolean; error: Error | null; account: Account } = {
  pending: false,
  error: null,
  account: XRP_ACCOUNT,
};
const signedOperation = {
  signature: "signature",
  operation: {
    id: "op-remove",
    accountId: XRP_ACCOUNT.id,
    hash: "",
    type: "OPT_OUT",
  },
} as unknown as SignedOperation;

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    createTransaction: () => ({ family: "xrp" }),
    updateTransaction: (tx: object, patch: object) => ({ ...tx, ...patch }),
  }),
}));
jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: (_: unknown, init: () => { transaction: object }) => {
    mockUseBridgeTransaction();
    return {
      transaction: init().transaction,
      account: mockBridge.account,
      status: mockStatus,
      bridgePending: mockBridge.pending,
      bridgeError: mockBridge.error,
      updateAccount: mockUpdateAccount,
      updateTransaction: mockUpdateTransaction,
    };
  },
}));
jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: () => mockBroadcast,
}));
jest.mock("@features/platform-device-intent", () => ({
  ...jest.requireActual("@features/platform-device-intent"),
  createIntent: (_: unknown, input: unknown, callbacks: unknown) => {
    mockSignedInput(input);
    return { input, callbacks };
  },
}));
jest.mock("LLD/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: async () => ({}),
  DeviceIntentExecutor: (props: {
    intent: { callbacks: { onResult: (result: SignedOperation) => void } };
    onIntentJobComplete: () => void;
    onUserCancel: () => void;
  }) => (
    <>
      <button
        onClick={() => {
          props.intent.callbacks.onResult(signedOperation);
          props.onIntentJobComplete();
        }}
      >
        Sign on device
      </button>
      <button onClick={props.onUserCancel}>Cancel on device</button>
    </>
  ),
}));

const emptyIouAccount: XrpTokenAccount = { ...makeXrpTokenAccount(), balance: new BigNumber(0) };
const emptyMptAccount: XrpTokenAccount = { ...XRP_MPT_TOKEN_ACCOUNT, balance: new BigNumber(0) };

function renderDeleteAsset(tokenAccount: XrpTokenAccount) {
  const onBack = jest.fn();
  const onClose = jest.fn();
  const rendered = render(
    <Dialog open>
      <DialogContent>
        <DeleteAsset
          account={XRP_ACCOUNT}
          tokenAccount={tokenAccount}
          onBack={onBack}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>,
    { initialState: { accounts: [XRP_ACCOUNT] } },
  );

  return { ...rendered, onBack, onClose };
}

function getContinue() {
  return screen.getByTestId("xrp-delete-asset-continue");
}

describe("xrp DeleteAsset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStatus.errors = {};
    mockBridge.pending = false;
    mockBridge.error = null;
    mockBridge.account = XRP_ACCOUNT;
  });

  it("asks to empty a token that still has a balance, and Got it goes back to the list", async () => {
    const heldMptAccount = { ...emptyMptAccount, balance: new BigNumber(5) };
    const { user, onBack } = renderDeleteAsset(heldMptAccount);

    expect(screen.getByText("Empty your TMPT balance to remove it")).toBeVisible();
    expect(
      screen.getByText("Send your remaining TMPT balance to remove this asset."),
    ).toBeVisible();
    expect(screen.queryByTestId("xrp-delete-asset-continue")).not.toBeInTheDocument();
    expect(mockUseBridgeTransaction).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Got it" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("closes the whole dialog from the balance screen's close button", async () => {
    const heldMptAccount = { ...emptyMptAccount, balance: new BigNumber(5) };
    const { user, onBack, onClose } = renderDeleteAsset(heldMptAccount);

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onBack).not.toHaveBeenCalled();
  });

  it("asks to confirm the removal", () => {
    renderDeleteAsset(emptyMptAccount);

    expect(screen.getByText("Are you sure you want to delete TMPT?")).toBeVisible();
    expect(screen.getByText(/The locked amount will be released to your/)).toBeVisible();
    expect(screen.queryByRole("button", { name: /back/i })).not.toBeInTheDocument();
    expect(getContinue()).toHaveTextContent("Continue");
    expect(getContinue()).toBeEnabled();
  });

  it("closes the whole dialog from the confirmation's close button", async () => {
    const { user, onBack, onClose } = renderDeleteAsset(emptyMptAccount);

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onBack).not.toHaveBeenCalled();
  });

  it("shows the fee shortfall on Continue instead of the device, and Go to swap opens Swap", async () => {
    const feeError = Object.assign(new Error(), {
      name: "NotEnoughSpendableBalance",
      minimumAmount: "0.000012 XRP",
    });
    mockStatus.errors = { amount: feeError };
    const { user, onClose } = renderDeleteAsset(emptyMptAccount);

    expect(screen.queryByTestId("xrp-delete-asset-error")).not.toBeInTheDocument();

    await user.click(getContinue());

    expect(screen.getByText("Not enough balance")).toBeVisible();
    expect(
      screen.getByText("You need at least 0.000012 XRP to cover for the network fee."),
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: "Sign on device" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Go to swap" }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(
      "/swap",
      expect.objectContaining({
        state: expect.objectContaining({
          defaultCurrency: { toCurrencyId: XRP_ACCOUNT.currency.id },
          defaultAccountId: XRP_ACCOUNT.id,
        }),
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows coin-xrp's refusal and disables Continue", () => {
    mockStatus.errors = { transaction: new XrpOptOutTokenInEscrow() };
    renderDeleteAsset(emptyMptAccount);

    expect(screen.getByTestId("xrp-delete-asset-error")).toHaveTextContent(
      "Some of this token is in escrow",
    );
    expect(getContinue()).toBeDisabled();
  });

  it("prepares the removal again against the synced account", () => {
    const { rerender, onBack, onClose } = renderDeleteAsset(emptyMptAccount);

    expect(mockUpdateAccount).not.toHaveBeenCalled();

    const syncedAccount = { ...XRP_ACCOUNT, spendableBalance: new BigNumber(50_000_000) };
    rerender(
      <Dialog open>
        <DialogContent>
          <DeleteAsset
            account={syncedAccount}
            tokenAccount={emptyMptAccount}
            onBack={onBack}
            onClose={onClose}
          />
        </DialogContent>
      </Dialog>,
    );

    expect(mockUpdateAccount).toHaveBeenCalledTimes(1);
    expect(mockUpdateAccount).toHaveBeenCalledWith(syncedAccount);
    expect(mockUpdateTransaction).toHaveBeenCalledTimes(1);
  });

  it("disables Continue while the bridge prepares the removal", () => {
    mockBridge.pending = true;
    renderDeleteAsset(emptyMptAccount);

    expect(getContinue()).toBeDisabled();
  });

  it("signs an opt-out with a 0 limit, broadcasts it, adds the pending removal and shows success", async () => {
    mockBroadcast.mockResolvedValue(signedOperation.operation);
    const { user, store, onClose } = renderDeleteAsset(emptyIouAccount);

    await user.click(getContinue());
    await user.click(await screen.findByRole("button", { name: "Sign on device" }));

    expect(
      await screen.findByText("RLUSD was successfully removed from your account"),
    ).toBeVisible();
    expect(screen.getByText("You can add this asset again anytime.")).toBeVisible();
    expect(screen.queryByTestId("xrp-signature-view-details")).not.toBeInTheDocument();
    expect(mockSignedInput).toHaveBeenCalledTimes(1);
    expect(mockSignedInput).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction: expect.objectContaining({ mode: "optOut", amount: new BigNumber(0) }),
      }),
    );
    expect(mockBroadcast).toHaveBeenCalledTimes(1);
    expect(mockBroadcast).toHaveBeenCalledWith(signedOperation);
    const [storedAccount] = store.getState().accounts;
    expect(storedAccount.pendingOperations).toEqual([expect.objectContaining({ id: "op-remove" })]);

    await user.click(screen.getByRole("button", { name: "Got it" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows a failed broadcast with its notice, and Try again goes back to the confirmation", async () => {
    mockBroadcast.mockRejectedValue(new Error("network down"));
    const { user } = renderDeleteAsset(emptyMptAccount);

    await user.click(getContinue());
    await user.click(await screen.findByRole("button", { name: "Sign on device" }));

    expect(await screen.findByText("Failed to remove asset")).toBeVisible();
    expect(screen.getByTestId("xrp-signature-broadcast-error")).toBeVisible();

    await user.click(screen.getByTestId("xrp-signature-retry"));

    expect(screen.getByTestId("xrp-delete-asset-confirm")).toBeVisible();
  });

  it("goes back to the confirmation when the user cancels on the device", async () => {
    const { user } = renderDeleteAsset(emptyMptAccount);

    await user.click(getContinue());
    await user.click(await screen.findByRole("button", { name: "Cancel on device" }));

    expect(screen.getByTestId("xrp-delete-asset-confirm")).toBeVisible();
  });
});
