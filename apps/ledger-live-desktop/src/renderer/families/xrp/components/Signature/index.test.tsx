import React from "react";
import { render, screen } from "tests/testSetup";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import type { Operation, SignedOperation } from "@ledgerhq/types-live";
import { buildDeviceInitializationInput } from "LLD/components/DeviceIntentExecutor";
import { XRP_ACCOUNT } from "../../__mocks__/account.mock";
import { SignatureSteps } from "./index";
import { useSignatureSteps } from "./useSignatureSteps";

const mockBroadcast = jest.fn<Promise<Operation>, [SignedOperation]>();
const signedOperation = {
  signature: "signature",
  operation: {
    id: "op-trust",
    accountId: XRP_ACCOUNT.id,
    hash: "",
    type: "OPT_EDIT",
  },
} as unknown as SignedOperation;

jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: () => mockBroadcast,
}));
jest.mock("@features/platform-device-intent", () => ({
  ...jest.requireActual("@features/platform-device-intent"),
  createIntent: (_: unknown, input: unknown, callbacks: unknown) => ({ input, callbacks }),
}));
jest.mock("LLD/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(async () => ({})),
  DeviceIntentExecutor: (props: {
    sourceFlow: string;
    intent: { callbacks: { onResult: (result: SignedOperation) => void } };
    onIntentJobComplete: () => void;
    onExecutorStateChanged: (state: { type: string }) => void;
  }) => (
    <div data-testid="device-executor" data-source-flow={props.sourceFlow}>
      <button onClick={() => props.intent.callbacks.onResult(signedOperation)}>Sign</button>
      <button onClick={() => props.onExecutorStateChanged({ type: "deviceDisconnected" })}>
        Disconnect
      </button>
      <button onClick={props.onIntentJobComplete}>Complete</button>
    </div>
  ),
}));

const transaction = { family: "xrp" } as Transaction;
const status = { errors: {}, warnings: {} } as TransactionStatus;

function Signing({ errorTitle }: Readonly<{ errorTitle?: string }>) {
  const signature = useSignatureSteps(XRP_ACCOUNT, transaction, status);

  return (
    <Dialog open>
      <DialogContent>
        <button onClick={signature.onStart}>Start</button>
        <SignatureSteps
          signature={signature}
          successTitle="Done"
          errorTitle={errorTitle}
          onClose={() => {}}
        />
      </DialogContent>
    </Dialog>
  );
}

async function startSigning() {
  const utils = render(<Signing />);
  await utils.user.click(screen.getByRole("button", { name: "Start" }));
  await screen.findByTestId("device-executor");

  return utils;
}

describe("xrp SignatureSteps", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBroadcast.mockResolvedValue(signedOperation.operation);
  });

  it("prepares the device for asset management", async () => {
    await startSigning();

    expect(buildDeviceInitializationInput).toHaveBeenCalledTimes(1);
    expect(buildDeviceInitializationInput).toHaveBeenCalledWith({
      appRequest: { account: XRP_ACCOUNT },
      flow: "manageAssets",
    });
    expect(screen.getByTestId("device-executor")).toHaveAttribute(
      "data-source-flow",
      "manage_assets",
    );
  });

  it("broadcasts once when the device disconnects after signing", async () => {
    const { user } = await startSigning();

    await user.click(screen.getByRole("button", { name: "Sign" }));
    await user.click(screen.getByRole("button", { name: "Disconnect" }));

    expect(await screen.findByText("Done")).toBeVisible();
    expect(mockBroadcast).toHaveBeenCalledTimes(1);
    expect(mockBroadcast).toHaveBeenCalledWith(signedOperation);
  });

  it("does not broadcast when the device disconnects before signing", async () => {
    const { user } = await startSigning();

    await user.click(screen.getByRole("button", { name: "Disconnect" }));

    expect(mockBroadcast).not.toHaveBeenCalled();
    expect(screen.getByTestId("device-executor")).toBeVisible();
  });

  it("shows the device preparation error, without the broadcast text", async () => {
    jest.mocked(buildDeviceInitializationInput).mockRejectedValueOnce(new Error("no device"));
    const { user } = render(<Signing />);

    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(await screen.findByTestId("xrp-signature-error")).toBeVisible();
    expect(screen.queryByText(/Your transaction may have failed/)).not.toBeInTheDocument();
  });

  it("shows a given error title over an unsigned failure, without the broadcast notice", async () => {
    jest.mocked(buildDeviceInitializationInput).mockRejectedValueOnce(new Error("no device"));
    const { user } = render(<Signing errorTitle="Failed to remove asset" />);

    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(await screen.findByText("Failed to remove asset")).toBeVisible();
    expect(screen.queryByTestId("xrp-signature-broadcast-error")).not.toBeInTheDocument();
  });
});
