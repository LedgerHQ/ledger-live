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
  operation: {
    id: "op-trust",
    accountId: XRP_ACCOUNT.id,
    hash: "",
    type: "OPT_IN",
  },
  signature: "signature",
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

function Signing() {
  const signature = useSignatureSteps(XRP_ACCOUNT, transaction, status);

  return (
    <Dialog open>
      <DialogContent>
        <button onClick={signature.onStart}>Start</button>
        <SignatureSteps signature={signature} successTitle="Done" onClose={() => {}} />
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

  it("prepares the device for a send, so the currency deprecation screen can show", async () => {
    await startSigning();

    expect(buildDeviceInitializationInput).toHaveBeenCalledWith({
      appRequest: { account: XRP_ACCOUNT },
      flow: "send",
    });
  });

  it("reports the device flow as asset management", async () => {
    await startSigning();

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
});
