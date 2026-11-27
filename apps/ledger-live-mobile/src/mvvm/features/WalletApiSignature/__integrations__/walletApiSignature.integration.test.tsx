import React, { useEffect } from "react";
import { render, waitFor, act } from "@tests/test-renderer";
import TransactionSignatureDrawer from "../components/TransactionSignatureDrawer";
import MessageSignatureDrawer from "../components/MessageSignatureDrawer";
import RawTransactionSignatureDrawer from "../components/RawTransactionSignatureDrawer";
import type { WalletApiDeviceIntentSignRequest } from "../components/TransactionSignatureDrawer";
import type { WalletApiDeviceIntentSignMessageRequest } from "../components/MessageSignatureDrawer";
import type { WalletApiDeviceIntentSignRawRequest } from "../components/RawTransactionSignatureDrawer";
import { useWalletApiSignatureQueue } from "../hooks/useWalletApiSignatureQueue";

// The Device Intent Executor drives a real device connection + bottom sheet, which cannot
// run in jest. We mock it to a marker view and capture its props, so this test focuses on
// the feature wiring: each drawer container resolves its init input, builds the intent, and
// forwards the executor callbacks to the wallet-api promise handlers.
type ExecutorProps = {
  sourceFlow: string;
  analyticsProperties?: Record<string, unknown>;
  intent: unknown;
  intentComponentExtraProps?: Record<string, unknown>;
  onIntentJobStateChanged: (state: { type: string; [key: string]: unknown }) => void;
  onIntentJobComplete: () => void;
  onIntentJobError: (error: unknown) => void;
  onUserCancel: () => void;
};

let mockExecutorProps: ExecutorProps | undefined;

jest.mock("LLM/components/DeviceIntentExecutor", () => {
  const ReactModule = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    buildDeviceInitializationInput: jest.fn(() => Promise.resolve({ appName: "Ethereum" })),
    DeviceIntentExecutor: (props: ExecutorProps) => {
      mockExecutorProps = props;
      return ReactModule.createElement(View, { testID: "device-intent-executor" });
    },
  };
});

jest.mock("@features/platform-device-intent", () => ({
  createIntent: jest.fn((definition: unknown, input: unknown, listeners?: object) => ({
    uuid: "intent-1",
    definition,
    input,
    ...listeners,
  })),
}));

const mockPrepareTransaction = jest.fn((_account: unknown, tx: unknown) => Promise.resolve(tx));
jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(() => Promise.resolve({ prepareTransaction: mockPrepareTransaction })),
}));

jest.mock("@ledgerhq/live-common/device-action/utils", () => ({
  FlowName: { unknown: "unknown" },
}));

jest.mock("@ledgerhq/live-common/hw/actions/app", () => ({
  dependenciesToAppRequests: jest.fn((deps?: string[]) =>
    (deps ?? []).map(appName => ({ appName })),
  ),
}));

jest.mock("../components/TransactionSignatureDrawer/intentDefinition", () => ({
  signTransactionIntentPlatformDefinition: { label: "Sign transaction" },
}));

jest.mock("../components/MessageSignatureDrawer/intentDefinition", () => ({
  signMessageIntentPlatformDefinition: { label: "Sign message" },
}));

jest.mock("../components/RawTransactionSignatureDrawer/intentDefinition", () => ({
  signRawTransactionIntentPlatformDefinition: { label: "Sign raw transaction" },
}));

const account = { id: "js:2:ethereum:0xabc:", type: "Account", currency: { name: "Ethereum" } };

function buildTransactionRequest(recipient: string) {
  const onSuccess = jest.fn();
  const onError = jest.fn();
  const request = {
    account,
    parentAccount: undefined,
    transaction: { family: "ethereum", recipient },
    appName: undefined,
    dependencies: undefined,
    manifestId: "ledger-wallet-connect",
    manifestName: "WalletConnect",
    onSuccess,
    onError,
  } as unknown as WalletApiDeviceIntentSignRequest;
  return { request, onSuccess, onError };
}

type SignatureQueue = ReturnType<typeof useWalletApiSignatureQueue>;

/** Renders the queued drawers the way the Wallet API webview does. */
function SignatureQueueHost({ onQueue }: { onQueue: (queue: SignatureQueue) => void }) {
  const queue = useWalletApiSignatureQueue();
  useEffect(() => {
    onQueue(queue);
  }, [onQueue, queue]);
  const { currentSignature, closeCurrentSignature } = queue;
  return (
    <>
      {currentSignature?.type === "transaction" && (
        <TransactionSignatureDrawer
          key={currentSignature.id}
          request={currentSignature.request}
          onClose={closeCurrentSignature}
        />
      )}
      {currentSignature?.type === "rawTransaction" && (
        <RawTransactionSignatureDrawer
          key={currentSignature.id}
          request={currentSignature.request}
          onClose={closeCurrentSignature}
        />
      )}
      {currentSignature?.type === "message" && (
        <MessageSignatureDrawer
          key={currentSignature.id}
          request={currentSignature.request}
          onClose={closeCurrentSignature}
        />
      )}
    </>
  );
}

describe("WalletApiSignature feature", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecutorProps = undefined;
  });

  it("mounts the executor for a transaction request and resolves the promise on signed", async () => {
    const onSuccess = jest.fn();
    const onClose = jest.fn();
    const transaction = {
      family: "ethereum",
      recipient: "0x111111125421ca6dc452d289314280a0f8842a65",
    };
    const request = {
      account,
      parentAccount: undefined,
      transaction,
      appName: undefined,
      dependencies: undefined,
      manifestId: "swap-live-app",
      manifestName: "Swap",
      onSuccess,
      onError: jest.fn(),
    } as unknown as WalletApiDeviceIntentSignRequest;

    const { getByTestId } = render(
      <TransactionSignatureDrawer request={request} onClose={onClose} />,
    );

    await waitFor(() => expect(getByTestId("device-intent-executor")).toBeTruthy());
    expect(mockExecutorProps?.sourceFlow).toBe("wallet_api");
    expect(mockExecutorProps?.analyticsProperties).toEqual({
      manifestId: "swap-live-app",
      manifestName: "Swap",
    });
    // The provider terms footer relies on manifest + recipient being forwarded to the component.
    expect(mockExecutorProps?.intentComponentExtraProps).toEqual({
      manifestId: "swap-live-app",
      manifestName: "Swap",
      recipient: "0x111111125421ca6dc452d289314280a0f8842a65",
    });
    expect(mockPrepareTransaction).toHaveBeenCalledWith(account, transaction);

    const signedOperation = { operation: { id: "op-1" } };
    act(() => mockExecutorProps!.onIntentJobStateChanged({ type: "signed", signedOperation }));

    expect(onSuccess).toHaveBeenCalledWith(signedOperation);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("mounts the executor for a raw transaction request and resolves the promise once the job completes", async () => {
    const onSuccess = jest.fn();
    const onClose = jest.fn();
    const request = {
      account,
      parentAccount: undefined,
      transaction: "cHNidP8BAA==",
      broadcast: true,
      appName: undefined,
      dependencies: undefined,
      manifestId: "ledger-wallet-connect",
      manifestName: "WalletConnect",
      onSuccess,
      onError: jest.fn(),
    } as unknown as WalletApiDeviceIntentSignRawRequest;

    const { getByTestId } = render(
      <RawTransactionSignatureDrawer request={request} onClose={onClose} />,
    );

    await waitFor(() => expect(getByTestId("device-intent-executor")).toBeTruthy());
    expect(mockExecutorProps?.sourceFlow).toBe("wallet_connect");
    expect(mockExecutorProps?.analyticsProperties).toEqual({
      manifestId: "ledger-wallet-connect",
      manifestName: "WalletConnect",
    });
    expect(mockExecutorProps?.intentComponentExtraProps).toEqual({
      manifestId: "ledger-wallet-connect",
      manifestName: "WalletConnect",
    });
    expect(mockExecutorProps?.intent).toMatchObject({
      input: {
        account,
        transaction: "cHNidP8BAA==",
        broadcast: true,
        manifestId: "ledger-wallet-connect",
      },
    });

    const signedOperation = { operation: { id: "op-1" }, signature: "0200000001" };
    const intent = mockExecutorProps!.intent as { onResult: (result: unknown) => void };
    act(() => intent.onResult(signedOperation));
    expect(onSuccess).not.toHaveBeenCalled();
    act(() => mockExecutorProps!.onIntentJobComplete());

    expect(onSuccess).toHaveBeenCalledWith(signedOperation);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("mounts the executor for a message request and resolves the promise on signed", async () => {
    const onSuccess = jest.fn();
    const onClose = jest.fn();
    const onCancel = jest.fn();
    const request = {
      account,
      parentAccount: undefined,
      message: { message: "hello" },
      appName: undefined,
      dependencies: undefined,
      manifestId: "swap-live-app",
      manifestName: "Swap",
      onSuccess,
      onError: jest.fn(),
      onCancel,
    } as unknown as WalletApiDeviceIntentSignMessageRequest;

    const { getByTestId } = render(<MessageSignatureDrawer request={request} onClose={onClose} />);

    await waitFor(() => expect(getByTestId("device-intent-executor")).toBeTruthy());
    expect(mockExecutorProps?.sourceFlow).toBe("wallet_api");
    expect(mockExecutorProps?.analyticsProperties).toEqual({
      manifestId: "swap-live-app",
      manifestName: "Swap",
    });

    act(() => mockExecutorProps!.onIntentJobStateChanged({ type: "signed", signature: "0xsig" }));

    expect(onSuccess).toHaveBeenCalledWith("0xsig");
    expect(onClose).toHaveBeenCalledTimes(1);

    // Dismissing after a successful signature must not additionally reject via onCancel.
    act(() => mockExecutorProps!.onUserCancel());
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("tracks Wallet Connect transaction requests as the wallet_connect flow", async () => {
    const request = {
      account,
      parentAccount: undefined,
      transaction: { family: "ethereum", recipient: "0x111111125421ca6dc452d289314280a0f8842a65" },
      appName: undefined,
      dependencies: undefined,
      manifestId: "ledger-wallet-connect",
      manifestName: "WalletConnect",
      onSuccess: jest.fn(),
      onError: jest.fn(),
    } as unknown as WalletApiDeviceIntentSignRequest;

    const { getByTestId } = render(
      <TransactionSignatureDrawer request={request} onClose={jest.fn()} />,
    );

    await waitFor(() => expect(getByTestId("device-intent-executor")).toBeTruthy());
    expect(mockExecutorProps?.sourceFlow).toBe("wallet_connect");
  });

  it("tracks Wallet Connect message requests as the wallet_connect flow", async () => {
    const request = {
      account,
      parentAccount: undefined,
      message: { message: "hello" },
      appName: undefined,
      dependencies: undefined,
      manifestId: "ledger-wallet-connect",
      manifestName: "WalletConnect",
      onSuccess: jest.fn(),
      onError: jest.fn(),
      onCancel: jest.fn(),
    } as unknown as WalletApiDeviceIntentSignMessageRequest;

    const { getByTestId } = render(
      <MessageSignatureDrawer request={request} onClose={jest.fn()} />,
    );

    await waitFor(() => expect(getByTestId("device-intent-executor")).toBeTruthy());
    expect(mockExecutorProps?.sourceFlow).toBe("wallet_connect");
  });

  it("signs concurrent requests one after the other and rejects with the real signing error", async () => {
    const first = buildTransactionRequest("0xfirst");
    const second = buildTransactionRequest("0xsecond");
    let queue: SignatureQueue | undefined;
    const { getByTestId } = render(
      <SignatureQueueHost
        onQueue={latest => {
          queue = latest;
        }}
      />,
    );

    act(() => {
      queue!.enqueueTransactionSignature(first.request);
      queue!.enqueueTransactionSignature(second.request);
    });
    await waitFor(() => expect(getByTestId("device-intent-executor")).toBeTruthy());
    expect(mockExecutorProps?.intentComponentExtraProps?.recipient).toBe("0xfirst");

    const signedOperation = { operation: { id: "op-1" } };
    act(() => mockExecutorProps!.onIntentJobStateChanged({ type: "signed", signedOperation }));
    expect(first.onSuccess).toHaveBeenCalledWith(signedOperation);

    await waitFor(() =>
      expect(mockExecutorProps?.intentComponentExtraProps?.recipient).toBe("0xsecond"),
    );
    const signingError = new Error("Not enough gas");
    act(() => mockExecutorProps!.onIntentJobError(signingError));
    act(() => mockExecutorProps!.onUserCancel());

    expect(second.onError).toHaveBeenCalledWith(signingError);
    expect(second.onSuccess).not.toHaveBeenCalled();
    expect(first.onError).not.toHaveBeenCalled();
    expect(queue!.currentSignature).toBeNull();
  });
});
