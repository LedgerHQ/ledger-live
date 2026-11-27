import React, { useEffect } from "react";
import BigNumber from "bignumber.js";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { render, waitFor, act, withFlagOverrides } from "@tests/test-renderer";
import TransactionSignatureDrawer from "../components/TransactionSignatureDrawer";
import MessageSignatureDrawer from "../components/MessageSignatureDrawer";
import type { WalletApiDeviceIntentSignRequest } from "../components/TransactionSignatureDrawer";
import type { WalletApiDeviceIntentSignMessageRequest } from "../components/MessageSignatureDrawer";
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
const mockGetTransactionStatus = jest.fn((_account: unknown, _tx: unknown) =>
  Promise.resolve({
    errors: {},
    warnings: {},
    amount: new BigNumber(0),
    estimatedFees: new BigNumber("21000000000000"),
    totalSpent: new BigNumber("21000000000000"),
  }),
);
const mockBridge = {
  prepareTransaction: mockPrepareTransaction,
  getTransactionStatus: mockGetTransactionStatus,
  createTransaction: jest.fn(() => ({ family: "evm" })),
  updateTransaction: jest.fn((tx: object, patch: object) => ({ ...tx, ...patch })),
};
jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(() => Promise.resolve(mockBridge)),
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(() => mockBridge),
}));

jest.mock("@shared/analytics", () => ({
  track: jest.fn(),
  trackPage: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/flows/send/uiConfig", () => ({
  getSendUiConfig: jest.fn(() => ({
    hasFeePresets: true,
    hasCustomFees: true,
    hasCoinControl: false,
    hasDefaultStrategy: false,
    hasFiatAmountInput: false,
  })),
}));

jest.mock("@ledgerhq/live-common/flows/send/effects/hooks/useFlowEffects", () => ({
  useFlowEffects: jest.fn(() => ({ loading: false, error: null })),
}));

// The presets estimation is covered in live-common: here, a preset only patches the transaction,
// which the fee step prepares again.
type MockNetworkFeesCoreParams = {
  transaction: { feesStrategy?: string };
  transactionActions: { updateTransaction: (updater: (tx: object) => object) => void };
};
jest.mock("@ledgerhq/live-common/flows/send/hooks/useNetworkFeesCore", () => ({
  useNetworkFeesCore: ({ transaction, transactionActions }: MockNetworkFeesCoreParams) => ({
    feesRowValue: "0.000021 ETH",
    feesRowSecondaryValue: null,
    selectedFeeStrategy: transaction.feesStrategy ?? null,
    selectedFeeStrategyId: transaction.feesStrategy ?? "medium",
    feeStrategyOptions: ["slow", "medium", "fast"].map(id => ({
      id,
      kind: "preset",
      sublabelFiat: null,
      sublabelCrypto: `${id} ETH`,
      sublabelLegend: null,
    })),
    onSelectFeeStrategyId: (id: string) =>
      transactionActions.updateTransaction(tx => ({ ...tx, feesStrategy: id })),
    hasCustomFees: true,
    hasCoinControl: false,
  }),
}));

jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features", () => ({
  sendFeatures: { hasFeeRateLegend: jest.fn(() => false) },
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

const account = {
  id: "js:2:ethereum:0xabc:",
  type: "Account",
  currency: {
    type: "CryptoCurrency",
    id: "ethereum",
    family: "evm",
    name: "Ethereum",
    ticker: "ETH",
    units: [{ name: "ether", code: "ETH", magnitude: 18 }],
  },
};

const withFeeSelection = withFlagOverrides({
  llmWalletApiDeviceIntentSign: {
    enabled: true,
    params: { feeSelectionManifestIds: ["ledger-wallet-connect"] },
  },
});

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

function buildFeeRequest({
  manifestId = "ledger-wallet-connect",
  canEditFees = true,
  hasFeesProvided = false,
}: { manifestId?: string; canEditFees?: boolean; hasFeesProvided?: boolean } = {}) {
  const onSuccess = jest.fn();
  const onError = jest.fn();
  const request = {
    account,
    parentAccount: undefined,
    transaction: {
      family: "evm",
      recipient: "0x111111125421ca6dc452d289314280a0f8842a65",
      ...(hasFeesProvided ? { feesStrategy: "custom" } : {}),
    },
    canEditFees,
    hasFeesProvided,
    appName: undefined,
    dependencies: undefined,
    manifestId,
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

  describe("fee step", () => {
    it("signs a Wallet Connect transaction with the fees chosen before the device step", async () => {
      const { request, onSuccess } = buildFeeRequest();
      const onClose = jest.fn();

      const { getByTestId, queryByTestId, user } = render(
        <TransactionSignatureDrawer request={request} onClose={onClose} />,
        { overrideInitialState: withFeeSelection },
      );

      await waitFor(() => expect(getByTestId("wallet-api-fee-step")).toBeTruthy());
      expect(queryByTestId("device-intent-executor")).toBeNull();
      expect(getByTestId("wallet-api-fee-step-total")).toHaveTextContent("0.000021 ETH");

      await user.press(getByTestId("wallet-api-fee-option-fast"));
      await waitFor(() =>
        expect(mockPrepareTransaction).toHaveBeenLastCalledWith(
          expect.anything(),
          expect.objectContaining({ feesStrategy: "fast" }),
        ),
      );
      await waitFor(() => expect(getByTestId("wallet-api-fee-step-continue")).not.toBeDisabled());

      await user.press(getByTestId("wallet-api-fee-step-continue"));

      await waitFor(() => expect(getByTestId("device-intent-executor")).toBeTruthy());
      expect(mockExecutorProps?.sourceFlow).toBe("wallet_connect");
      expect(mockExecutorProps?.intent).toEqual(
        expect.objectContaining({
          input: expect.objectContaining({
            transaction: expect.objectContaining({ feesStrategy: "fast" }),
          }),
        }),
      );

      const signedOperation = { operation: { id: "op-1" } };
      act(() => mockExecutorProps!.onIntentJobStateChanged({ type: "signed", signedOperation }));
      expect(onSuccess).toHaveBeenCalledWith(signedOperation);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("selects the live app's fees by default when it provides them", async () => {
      const { request } = buildFeeRequest({ hasFeesProvided: true });

      const { getByTestId, getByText } = render(
        <TransactionSignatureDrawer request={request} onClose={jest.fn()} />,
        { overrideInitialState: withFeeSelection },
      );

      await waitFor(() => expect(getByTestId("wallet-api-fee-step")).toBeTruthy());
      expect(getByText("Fees from WalletConnect")).toBeTruthy();
      expect(getByTestId("wallet-api-fee-option-custom")).toBeSelected();
    });

    it("rejects the request like the device step does when the fee step is closed", async () => {
      const { request, onError } = buildFeeRequest();
      const onClose = jest.fn();

      const { getByTestId, getByLabelText, user } = render(
        <TransactionSignatureDrawer request={request} onClose={onClose} />,
        { overrideInitialState: withFeeSelection },
      );

      await waitFor(() => expect(getByTestId("wallet-api-fee-step")).toBeTruthy());
      await user.press(getByLabelText(/close/i));

      await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
      expect(onError.mock.calls[0][0]).toBeInstanceOf(UserRefusedOnDevice);
      expect(onClose).toHaveBeenCalled();
    });

    it("goes straight to the device for a live app outside the fee selection allowlist", async () => {
      const { request } = buildFeeRequest({ manifestId: "swap-live-app" });

      const { getByTestId, queryByTestId } = render(
        <TransactionSignatureDrawer request={request} onClose={jest.fn()} />,
        { overrideInitialState: withFeeSelection },
      );

      await waitFor(() => expect(getByTestId("device-intent-executor")).toBeTruthy());
      expect(queryByTestId("wallet-api-fee-step")).toBeNull();
    });
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
