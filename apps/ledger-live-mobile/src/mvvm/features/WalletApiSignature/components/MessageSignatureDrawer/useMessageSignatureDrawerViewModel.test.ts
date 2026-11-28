import { act, renderHook, waitFor } from "@tests/test-renderer";
import { createIntent } from "@features/platform-device-intent";
import { buildDeviceInitializationInput } from "LLM/components/DeviceIntentExecutor";
import { useMessageSignatureDrawerViewModel } from "./useMessageSignatureDrawerViewModel";
import type { WalletApiDeviceIntentSignMessageRequest } from "./types";

jest.mock("@features/platform-device-intent", () => ({
  createIntent: jest.fn(
    (_definition: unknown, _input: unknown, listeners?: Record<string, unknown>) => ({
      uuid: "intent-1",
      ...listeners,
    }),
  ),
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
  signMessageIntentPlatformDefinition: { label: "Sign message" },
}));

const mockedBuildInput = jest.mocked(buildDeviceInitializationInput);
const mockedCreateIntent = jest.mocked(createIntent);

const account = {
  id: "js:2:ethereum:0xabc:",
  type: "Account",
  currency: { name: "Ethereum" },
};
const message = { standard: undefined, message: "hello" };

function setup(overrides?: {
  onSuccess?: jest.Mock;
  onError?: jest.Mock;
  onCancel?: jest.Mock;
  onClose?: jest.Mock;
}) {
  const onSuccess = overrides?.onSuccess ?? jest.fn();
  const onError = overrides?.onError ?? jest.fn();
  const onCancel = overrides?.onCancel ?? jest.fn();
  const onClose = overrides?.onClose ?? jest.fn();

  const request = {
    account,
    parentAccount: undefined,
    message,
    appName: undefined,
    dependencies: undefined,
    manifestId: "swap-live-app",
    manifestName: "Swap",
    onSuccess,
    onError,
    onCancel,
  } as unknown as WalletApiDeviceIntentSignMessageRequest;

  const utils = renderHook(() => useMessageSignatureDrawerViewModel({ request, onClose }));
  return { ...utils, onSuccess, onError, onCancel, onClose };
}

describe("useMessageSignatureDrawerViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds the device initialization input and the signature intent", async () => {
    const { result } = setup();

    await waitFor(() =>
      expect(result.current.deviceInitializationInput).toEqual({ appName: "Ethereum" }),
    );

    expect(mockedBuildInput).toHaveBeenCalledWith(
      expect.objectContaining({
        appRequest: expect.objectContaining({ account }),
        flow: "unknown",
      }),
    );
    expect(mockedCreateIntent).toHaveBeenCalledWith(
      { label: "Sign message" },
      expect.objectContaining({ account, message }),
      { onResult: expect.any(Function) },
    );
    expect(result.current.signatureIntent).toMatchObject({ uuid: "intent-1" });
  });

  it("defers success until onIntentJobComplete after the signed result is reported", async () => {
    const { result, onSuccess, onClose } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    act(() => {
      result.current.signatureIntent?.onResult?.("0xsignature");
    });

    expect(onSuccess).not.toHaveBeenCalled();

    act(() => {
      result.current.onIntentJobComplete();
    });

    expect(onSuccess).toHaveBeenCalledWith("0xsignature");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("rejects via onCancel and closes when the user dismisses before signing", async () => {
    const { result, onCancel, onClose } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    act(() => {
      result.current.onUserCancel();
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("settles success on cancel when a signed result was already stored", async () => {
    const { result, onSuccess, onCancel, onClose } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    act(() => {
      result.current.signatureIntent?.onResult?.("0xsignature");
    });
    act(() => {
      result.current.onUserCancel();
    });

    expect(onSuccess).toHaveBeenCalledWith("0xsignature");
    expect(onCancel).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("rejects and closes when building the device initialization input fails", async () => {
    const failure = new Error("build failed");
    mockedBuildInput.mockRejectedValueOnce(failure);

    const { onError, onClose } = setup();

    await waitFor(() => expect(onError).toHaveBeenCalledWith(failure));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("rejects with the signing error instead of onCancel when the user closes the error screen", async () => {
    const { result, onError, onCancel, onClose } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());
    const signingError = new Error("Unsupported message");

    act(() => {
      result.current.onIntentJobError(signingError);
    });
    act(() => {
      result.current.onUserCancel();
    });

    expect(onError).toHaveBeenCalledWith(signingError);
    expect(onCancel).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("forgets the signing error once a retried attempt runs", async () => {
    const { result, onError, onCancel } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    act(() => {
      result.current.onIntentJobError(new Error("Unsupported message"));
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

    expect(onError).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it.each(["connectingDevice", "initializingDeviceContext"] as const)(
    "reports a cancellation when closed on %s after a failed attempt, before the next job state",
    async executorStateType => {
      const { result, onError, onCancel } = setup();
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

      expect(onError).not.toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalledTimes(1);
    },
  );

  it("keeps the signing error while the executor shows its error screens", async () => {
    const { result, onError, onCancel } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());
    const signingError = new Error("Device disconnected");

    act(() => {
      result.current.onIntentJobError(signingError);
    });
    act(() => {
      result.current.onExecutorStateChanged({
        type: "deviceDisconnected",
      } as Parameters<typeof result.current.onExecutorStateChanged>[0]);
    });
    act(() => {
      result.current.onUserCancel();
    });

    expect(onError).toHaveBeenCalledWith(signingError);
    expect(onCancel).not.toHaveBeenCalled();
  });
});
