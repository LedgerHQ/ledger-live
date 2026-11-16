import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import type { Operation, SignedOperation, TokenAccount } from "@ledgerhq/types-live";
import { DeleteAsset } from "./index";
import {
  XRP_ACCOUNT,
  XRP_MPT_TOKEN_ACCOUNT,
  makeXrpTokenAccount,
} from "../../__mocks__/account.mock";

const mockBroadcast = jest.fn<Promise<Operation>, [SignedOperation]>();
const mockStatus = { errors: {} as Record<string, Error>, warnings: {} };
const signedOperation = {
  operation: { id: "op-remove", accountId: XRP_ACCOUNT.id, hash: "", type: "OPT_OUT" },
  signature: "signature",
} as unknown as SignedOperation;

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({}),
}));
jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: () => ({
    transaction: { family: "xrp", mode: "optOut" },
    status: mockStatus,
    bridgePending: false,
  }),
}));
jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: () => mockBroadcast,
}));
jest.mock("@features/platform-device-intent", () => ({
  ...jest.requireActual("@features/platform-device-intent"),
  createIntent: (_: unknown, input: unknown, callbacks: unknown) => ({ input, callbacks }),
}));
jest.mock("LLD/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: () => Promise.resolve({}),
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

const emptyIouAccount = { ...makeXrpTokenAccount(), balance: new BigNumber(0) };
const emptyMptAccount = { ...XRP_MPT_TOKEN_ACCOUNT, balance: new BigNumber(0) };

function renderDeleteAsset(tokenAccount: TokenAccount) {
  const onBackToList = jest.fn();
  const onClose = jest.fn();
  const rendered = render(
    <Dialog open>
      <DialogContent>
        <DeleteAsset
          account={XRP_ACCOUNT}
          tokenAccount={tokenAccount}
          onBackToList={onBackToList}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>,
    { initialState: { accounts: [XRP_ACCOUNT] } },
  );

  return { ...rendered, onBackToList, onClose };
}

describe("xrp DeleteAsset", () => {
  beforeEach(() => {
    mockStatus.errors = {};
    mockBroadcast.mockReset();
  });

  it("asks to empty a token that still has a balance, and goes back to the list", async () => {
    const heldAccount = { ...emptyMptAccount, balance: new BigNumber(5) };
    const { user, onBackToList } = renderDeleteAsset(heldAccount);

    expect(screen.getByText("Empty your Test MPT balance to remove it")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Got it" }));

    expect(onBackToList).toHaveBeenCalledTimes(1);
  });

  it("asks to confirm an MPT removal, without the trust limit notice", () => {
    renderDeleteAsset(emptyMptAccount);

    expect(screen.getByText("Are you sure you want to delete Test MPT?")).toBeVisible();
    expect(screen.queryByText(/trust limit of 0/)).not.toBeInTheDocument();
  });

  it("tells an IOU holder the device shows a trust limit of 0", () => {
    renderDeleteAsset(emptyIouAccount);

    expect(screen.getByText(/trust limit of 0/)).toBeVisible();
  });

  it("signs, broadcasts, adds the pending removal and shows success", async () => {
    mockBroadcast.mockResolvedValue(signedOperation.operation);
    const { user, store } = renderDeleteAsset(emptyMptAccount);

    await user.click(screen.getByTestId("xrp-delete-asset-confirm-cta"));
    await user.click(await screen.findByRole("button", { name: "Sign on device" }));

    expect(await screen.findByText("Test MPT removed")).toBeVisible();
    expect(mockBroadcast).toHaveBeenCalledWith(signedOperation);
    const [storedAccount] = store.getState().accounts;
    expect(storedAccount.pendingOperations).toEqual([expect.objectContaining({ id: "op-remove" })]);
  });

  it("shows a failed broadcast, and Retry goes back to the confirmation", async () => {
    mockBroadcast.mockRejectedValue(new Error("network down"));
    const { user } = renderDeleteAsset(emptyMptAccount);

    await user.click(screen.getByTestId("xrp-delete-asset-confirm-cta"));
    await user.click(await screen.findByRole("button", { name: "Sign on device" }));
    await user.click(await screen.findByTestId("send-signature-error-retry"));

    expect(screen.getByTestId("xrp-delete-asset-confirm")).toBeVisible();
  });

  it("shows a validation error instead of starting the device", async () => {
    mockStatus.errors = { fee: new Error("not enough XRP") };
    const { user } = renderDeleteAsset(emptyMptAccount);

    await user.click(screen.getByTestId("xrp-delete-asset-confirm-cta"));

    expect(screen.getByTestId("send-signature-error")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Sign on device" })).not.toBeInTheDocument();
  });

  it("goes back to the confirmation when the user cancels on the device", async () => {
    const { user } = renderDeleteAsset(emptyMptAccount);

    await user.click(screen.getByTestId("xrp-delete-asset-confirm-cta"));
    await user.click(await screen.findByRole("button", { name: "Cancel on device" }));

    expect(screen.getByTestId("xrp-delete-asset-confirm")).toBeVisible();
  });
});
