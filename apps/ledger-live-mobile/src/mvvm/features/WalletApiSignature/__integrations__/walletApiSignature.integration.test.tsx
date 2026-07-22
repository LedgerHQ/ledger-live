import React from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import TransactionSignatureDrawer from "../components/TransactionSignatureDrawer";
import MessageSignatureDrawer from "../components/MessageSignatureDrawer";
import type { WalletApiDeviceIntentSignRequest } from "../components/TransactionSignatureDrawer";
import type { WalletApiDeviceIntentSignMessageRequest } from "../components/MessageSignatureDrawer";

// The Device Intent Executor drives a real device connection + bottom sheet, which cannot
// run in jest. We mock it to a marker view and capture its props, so this test focuses on
// the feature wiring: each drawer container resolves its init input, builds the intent, and
// forwards the executor callbacks to the wallet-api promise handlers.
type ExecutorProps = {
  sourceFlow: string;
  analyticsProperties?: Record<string, unknown>;
  intent: unknown;
  onIntentJobStateChanged: (state: { type: string; [key: string]: unknown }) => void;
  onUserCancel: () => void;
};

let mockExecutorProps: ExecutorProps | undefined;

jest.mock("LLM/components/DeviceIntentExecutor", () => {
  const ReactModule = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    buildDeviceInitializationInput: jest.fn(() => Promise.resolve({ appName: "Ethereum" })),
    DeviceIntentExecutorLWM: (props: ExecutorProps) => {
      mockExecutorProps = props;
      return ReactModule.createElement(View, { testID: "device-intent-executor" });
    },
  };
});

jest.mock("@ledgerhq/device-intent", () => ({
  createIntent: jest.fn((definition: unknown, input: unknown) => ({
    uuid: "intent-1",
    definition,
    input,
  })),
}));

jest.mock("@ledgerhq/live-common/account/index", () => ({
  getMainAccount: jest.fn((account: unknown) => account),
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

describe("WalletApiSignature feature", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecutorProps = undefined;
  });

  it("mounts the executor for a transaction request and resolves the promise on signed", async () => {
    const onSuccess = jest.fn();
    const onClose = jest.fn();
    const request = {
      account,
      parentAccount: undefined,
      transaction: { family: "ethereum" },
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
    expect(mockPrepareTransaction).toHaveBeenCalledWith(account, { family: "ethereum" });

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
});
