import React, { useEffect } from "react";
import { render, waitFor, act } from "@tests/test-renderer";
import TransactionSignatureDrawer from "../components/TransactionSignatureDrawer";
import MessageSignatureDrawer from "../components/MessageSignatureDrawer";
import type { WalletApiDeviceIntentSignRequest } from "../components/TransactionSignatureDrawer";
import type { WalletApiDeviceIntentSignMessageRequest } from "../components/MessageSignatureDrawer";
import { useWalletApiSignatureQueue } from "../hooks/useWalletApiSignatureQueue";
import { handlers as signatureCancelHandlers } from "@features/platform-wallet-api-signature-cancel";

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
  createIntent: jest.fn((definition: unknown, input: unknown) => ({
    uuid: "intent-1",
    definition,
    input,
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

const account = { id: "js:2:ethereum:0xabc:", type: "Account", currency: { name: "Ethereum" } };

function buildTransactionRequest(recipient: string, requestGroupId?: string) {
  const onSuccess = jest.fn();
  const onError = jest.fn();
  const request = {
    requestGroupId,
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

function buildMessageRequest(requestGroupId?: string) {
  const onError = jest.fn();
  const request = {
    account,
    parentAccount: undefined,
    message: { message: "hello" },
    appName: undefined,
    dependencies: undefined,
    manifestId: "ledger-wallet-connect",
    manifestName: "WalletConnect",
    requestGroupId,
    onSuccess: jest.fn(),
    onError,
    onCancel: jest.fn(),
  } as unknown as WalletApiDeviceIntentSignMessageRequest;
  return { request, onError };
}

type SignatureQueue = ReturnType<typeof useWalletApiSignatureQueue>;

/** Calls `custom.signature.cancel` the way the Wallet API server does once it is registered. */
function callSignatureCancel(queue: SignatureQueue, params: unknown) {
  const handler = signatureCancelHandlers({ cancelSignatures: queue.cancelSignatures })[
    "custom.signature.cancel"
  ];
  // The handler only reads the request params, not the wallet context nor the other handlers.
  const [request, context, walletHandlers] = [{ params }, {}, {}] as unknown as Parameters<
    typeof handler
  >;
  return handler(request, context, walletHandlers);
}

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

  describe("custom.signature.cancel", () => {
    it("closes the shown drawer and drops the queued request of the group, keeping the others", async () => {
      const shown = buildTransactionRequest("0xshown", "topic-a");
      const queued = buildMessageRequest("topic-a");
      const otherDapp = buildTransactionRequest("0xother", "topic-b");
      let queue: SignatureQueue | undefined;
      const { getByTestId } = render(
        <SignatureQueueHost
          onQueue={latest => {
            queue = latest;
          }}
        />,
      );
      act(() => {
        queue!.enqueueTransactionSignature(shown.request);
        queue!.enqueueMessageSignature(queued.request);
        queue!.enqueueTransactionSignature(otherDapp.request);
      });
      await waitFor(() =>
        expect(mockExecutorProps?.intentComponentExtraProps?.recipient).toBe("0xshown"),
      );

      let answer: unknown;
      act(() => {
        answer = callSignatureCancel(queue!, { requestGroupId: "topic-a" });
      });

      expect(answer).toEqual({ cancelled: 2 });
      const cancelled = expect.objectContaining({ name: "SignatureRequestCancelled" });
      expect(shown.onError).toHaveBeenCalledWith(cancelled);
      expect(queued.onError).toHaveBeenCalledWith(cancelled);
      expect(shown.onSuccess).not.toHaveBeenCalled();
      expect(otherDapp.onError).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(mockExecutorProps?.intentComponentExtraProps?.recipient).toBe("0xother"),
      );
      expect(getByTestId("device-intent-executor")).toBeTruthy();
      expect(queue!.currentSignature?.request).toBe(otherDapp.request);
    });

    it("never opens a request of the group that arrives once cancelled, e.g. still preparing", async () => {
      const late = buildTransactionRequest("0xlate", "topic-a");
      let queue: SignatureQueue | undefined;
      const { queryByTestId } = render(
        <SignatureQueueHost
          onQueue={latest => {
            queue = latest;
          }}
        />,
      );

      let answer: unknown;
      act(() => {
        answer = callSignatureCancel(queue!, { requestGroupId: "topic-a" });
      });
      act(() => queue!.enqueueTransactionSignature(late.request));

      expect(answer).toEqual({ cancelled: 0 });
      expect(late.onError).toHaveBeenCalledWith(
        expect.objectContaining({ name: "SignatureRequestCancelled" }),
      );
      expect(queue!.currentSignature).toBeNull();
      expect(queryByTestId("device-intent-executor")).toBeNull();
    });
  });
});
