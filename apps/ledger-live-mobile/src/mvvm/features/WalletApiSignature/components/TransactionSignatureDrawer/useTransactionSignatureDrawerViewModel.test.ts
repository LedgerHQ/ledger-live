import { act, renderHook, waitFor } from "@testing-library/react-native";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import type { SignedOperation } from "@ledgerhq/types-live";
import { createIntent } from "@ledgerhq/device-intent";
import { buildDeviceInitializationInput } from "LLM/components/DeviceIntentExecutor";
import { useTransactionSignatureDrawerViewModel } from "./useTransactionSignatureDrawerViewModel";
import type { WalletApiDeviceIntentSignRequest } from "./types";

jest.mock("@ledgerhq/device-intent", () => ({
  createIntent: jest.fn(() => ({ uuid: "intent-1" })),
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

jest.mock("LLM/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(() => Promise.resolve({ appName: "Ethereum" })),
}));

jest.mock("./intentLWMDefinition", () => ({
  signTransactionIntentLWMDefinition: { label: "Sign transaction" },
}));

const mockedBuildInput = jest.mocked(buildDeviceInitializationInput);
const mockedCreateIntent = jest.mocked(createIntent);

const account = {
  id: "js:2:ethereum:0xabc:",
  type: "Account",
  currency: { name: "Ethereum" },
};
const signedOperation = { operation: { id: "op-1" } } as unknown as SignedOperation;

function setup(overrides?: { onSuccess?: jest.Mock; onError?: jest.Mock; onClose?: jest.Mock }) {
  const onSuccess = overrides?.onSuccess ?? jest.fn();
  const onError = overrides?.onError ?? jest.fn();
  const onClose = overrides?.onClose ?? jest.fn();

  const request = {
    account,
    parentAccount: undefined,
    transaction: { family: "ethereum" },
    appName: undefined,
    dependencies: undefined,
    onSuccess,
    onError,
  } as unknown as WalletApiDeviceIntentSignRequest;

  const utils = renderHook(() => useTransactionSignatureDrawerViewModel({ request, onClose }));
  return { ...utils, onSuccess, onError, onClose };
}

describe("useTransactionSignatureDrawerViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds the device initialization input and the signature intent", async () => {
    const { result } = setup();

    await waitFor(() =>
      expect(result.current.deviceInitializationInput).toEqual({ appName: "Ethereum" }),
    );

    expect(mockPrepareTransaction).toHaveBeenCalledWith(account, { family: "ethereum" });
    expect(mockedBuildInput).toHaveBeenCalledWith(
      expect.objectContaining({
        appRequest: expect.objectContaining({ account }),
        flow: "unknown",
      }),
    );
    expect(mockedCreateIntent).toHaveBeenCalledWith(
      { label: "Sign transaction" },
      expect.objectContaining({ account, transaction: { family: "ethereum" } }),
    );
    expect(result.current.signatureIntent).toEqual({ uuid: "intent-1" });
  });

  it("resolves the wallet-api promise and closes the drawer on a signed job state", async () => {
    const { result, onSuccess, onClose } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    act(() => {
      result.current.onIntentJobStateChanged({ type: "signed", signedOperation });
    });

    expect(onSuccess).toHaveBeenCalledWith(signedOperation);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("rejects with UserRefusedOnDevice and closes when the user dismisses before signing", async () => {
    const { result, onError, onClose } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    act(() => {
      result.current.onUserCancel();
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(UserRefusedOnDevice);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not reject when dismissed after signing already completed", async () => {
    const { result, onError } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    act(() => {
      result.current.onIntentJobStateChanged({ type: "signed", signedOperation });
    });
    act(() => {
      result.current.onUserCancel();
    });

    expect(onError).not.toHaveBeenCalled();
  });

  it("rejects and closes when building the device initialization input fails", async () => {
    const failure = new Error("build failed");
    mockedBuildInput.mockRejectedValueOnce(failure);

    const { onError, onClose } = setup();

    await waitFor(() => expect(onError).toHaveBeenCalledWith(failure));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
