import { act, renderHook, waitFor } from "@tests/test-renderer";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import type { SignedOperation } from "@ledgerhq/types-live";
import { createIntent } from "@features/platform-device-intent";
import { buildDeviceInitializationInput } from "LLM/components/DeviceIntentExecutor";
import { useTransactionSignatureDrawerViewModel } from "./useTransactionSignatureDrawerViewModel";
import type { WalletApiDeviceIntentSignRequest } from "./types";

jest.mock("@features/platform-device-intent", () => ({
  createIntent: jest.fn(
    (_definition: unknown, _input: unknown, listeners?: Record<string, unknown>) => ({
      uuid: "intent-1",
      ...listeners,
    }),
  ),
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

jest.mock("./intentDefinition", () => ({
  signTransactionIntentPlatformDefinition: { label: "Sign transaction" },
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
    manifestId: "swap-live-app",
    manifestName: "Swap",
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
      { onResult: expect.any(Function) },
    );
    expect(result.current.signatureIntent).toMatchObject({ uuid: "intent-1" });
  });

  it("defers success until onIntentJobComplete after the signed result is reported", async () => {
    const { result, onSuccess, onClose } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    act(() => {
      result.current.signatureIntent?.onResult?.(signedOperation);
    });

    expect(onSuccess).not.toHaveBeenCalled();

    act(() => {
      result.current.onIntentJobComplete();
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

  it("settles success on cancel when a signed result was already stored", async () => {
    const { result, onSuccess, onError, onClose } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    act(() => {
      result.current.signatureIntent?.onResult?.(signedOperation);
    });
    act(() => {
      result.current.onUserCancel();
    });

    expect(onSuccess).toHaveBeenCalledWith(signedOperation);
    expect(onError).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("rejects with the executor failure when the user closes a failed connection", async () => {
    const { result, onError, onClose } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    act(() => {
      result.current.onUserCancel({ failureType: "WrongDeviceForAccount", countsAsFailure: true });
    });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "WrongDeviceForAccount" }),
    );
    expect(onError.mock.calls[0][0]).not.toBeInstanceOf(UserRefusedOnDevice);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("rejects and closes when building the device initialization input fails", async () => {
    const failure = new Error("build failed");
    mockedBuildInput.mockRejectedValueOnce(failure);

    const { onError, onClose } = setup();

    await waitFor(() => expect(onError).toHaveBeenCalledWith(failure));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("rejects with the signing error when the user closes the error screen", async () => {
    const { result, onError, onClose } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());
    const signingError = new Error("Not enough gas");

    act(() => {
      result.current.onIntentJobError(signingError);
    });
    expect(onError).not.toHaveBeenCalled();

    act(() => {
      result.current.onUserCancel();
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(signingError);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("forgets the signing error once a retried attempt runs", async () => {
    const { result, onError } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    act(() => {
      result.current.onIntentJobError(new Error("Not enough gas"));
    });
    act(() => {
      result.current.onIntentJobStateChanged({
        type: "pending",
        deviceModelId: "stax",
      } as unknown as Parameters<typeof result.current.onIntentJobStateChanged>[0]);
    });
    act(() => {
      result.current.onUserCancel();
    });

    expect(onError.mock.calls[0][0]).toBeInstanceOf(UserRefusedOnDevice);
  });

  it("settles the request only once", async () => {
    const { result, onSuccess, onError, onClose } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    act(() => {
      result.current.signatureIntent?.onResult?.(signedOperation);
      result.current.signatureIntent?.onResult?.(signedOperation);
      result.current.onUserCancel();
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each(["connectingDevice", "initializingDeviceContext"] as const)(
    "rejects with UserRefusedOnDevice when closed on %s after a failed attempt, before the next job state",
    async executorStateType => {
      const { result, onError } = setup();
      await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

      act(() => {
        result.current.onIntentJobError(new Error("Device disconnected"));
      });
      act(() => {
        result.current.onExecutorStateChanged({
          type: executorStateType,
        } as Parameters<typeof result.current.onExecutorStateChanged>[0]);
      });
      act(() => {
        result.current.onUserCancel();
      });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0]).toBeInstanceOf(UserRefusedOnDevice);
    },
  );

  it("keeps the signing error while the executor shows its error screens", async () => {
    const { result, onError } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());
    const signingError = new Error("Device disconnected");

    act(() => {
      result.current.onIntentJobError(signingError);
    });
    act(() => {
      result.current.onExecutorStateChanged({
        type: "executingIntentError",
      } as Parameters<typeof result.current.onExecutorStateChanged>[0]);
    });
    act(() => {
      result.current.onUserCancel();
    });

    expect(onError).toHaveBeenCalledWith(signingError);
  });
});
