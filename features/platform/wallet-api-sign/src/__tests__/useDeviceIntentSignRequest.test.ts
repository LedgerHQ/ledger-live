import { act, renderHook, waitFor } from "@testing-library/react";
import { createIntent, type IntentPlatformDefinition } from "@features/platform-device-intent";
import { useDeviceIntentSignRequest } from "../useDeviceIntentSignRequest";

jest.mock("@features/platform-device-intent", () => ({
  createIntent: jest.fn(() => ({ uuid: "intent-1" })),
}));

const mockedCreateIntent = jest.mocked(createIntent);

type TestRequest = Readonly<{ id: string }>;
type TestJobState =
  | { type: "pending" }
  | { type: "signed"; signature: string }
  | { type: "cancelled" };
type TestIntentInput = Readonly<{ payload: string }>;
type TestInitInput = Readonly<{ appName: string }>;
type TestResult = string;

const platformDefinition: IntentPlatformDefinition<TestJobState, TestIntentInput, undefined> = {
  label: "Test sign",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: true,
  job: () => {
    throw new Error("job should not run in this test");
  },
  component: () => null,
};

function createTestSignatureIntent(input: TestIntentInput) {
  return createIntent(platformDefinition, input);
}

function createRequest(id: string): TestRequest {
  return { id };
}

function getSignedResult(jobState: TestJobState): TestResult | undefined {
  return jobState.type === "signed" ? jobState.signature : undefined;
}

describe("useDeviceIntentSignRequest", () => {
  const prepare = jest.fn(async (request: TestRequest) => ({
    deviceInitializationInput: { appName: "Ethereum" } satisfies TestInitInput,
    intentInput: { payload: request.id } satisfies TestIntentInput,
  }));

  beforeEach(() => {
    jest.clearAllMocks();
    prepare.mockImplementation(async (request: TestRequest) => ({
      deviceInitializationInput: { appName: "Ethereum" },
      intentInput: { payload: request.id },
    }));
  });

  it("prepares device input then creates the intent", async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const onCancel = jest.fn();
    const onClose = jest.fn();
    const request = createRequest("req-1");

    const { result } = renderHook(() =>
      useDeviceIntentSignRequest({
        request,
        prepare,
        createSignatureIntent: createTestSignatureIntent,
        getSignedResult,
        onSuccess,
        onError,
        onCancel,
        onClose,
      }),
    );

    await waitFor(() =>
      expect(result.current.deviceInitializationInput).toEqual({ appName: "Ethereum" }),
    );
    expect(prepare).toHaveBeenCalledWith(request);
    expect(mockedCreateIntent).toHaveBeenCalledWith(platformDefinition, { payload: "req-1" });
    expect(result.current.signatureIntent).toEqual({ uuid: "intent-1" });
  });

  it("defers success until onIntentJobComplete", async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const onCancel = jest.fn();
    const onClose = jest.fn();
    const request = createRequest("req-2");

    const { result } = renderHook(() =>
      useDeviceIntentSignRequest({
        request,
        prepare,
        createSignatureIntent: createTestSignatureIntent,
        getSignedResult,
        onSuccess,
        onError,
        onCancel,
        onClose,
      }),
    );

    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());
    expect(prepare).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.onIntentJobStateChanged({ type: "signed", signature: "0xabc" });
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      result.current.onIntentJobComplete();
    });

    expect(onSuccess).toHaveBeenCalledWith("0xabc");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("rejects via onError and closes if onIntentJobComplete fires without a signed result", async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const onCancel = jest.fn();
    const onClose = jest.fn();
    const request = createRequest("req-2-empty");

    const { result } = renderHook(() =>
      useDeviceIntentSignRequest({
        request,
        prepare,
        createSignatureIntent: createTestSignatureIntent,
        getSignedResult,
        onSuccess,
        onError,
        onCancel,
        onClose,
      }),
    );

    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    act(() => {
      result.current.onIntentJobComplete();
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("rejects with the last job error when cancelled after an intent error, unless cleared by retry", async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const onCancel = jest.fn();
    const onClose = jest.fn();
    const request = createRequest("req-error-cancel");

    const { result } = renderHook(() =>
      useDeviceIntentSignRequest({
        request,
        prepare,
        createSignatureIntent: createTestSignatureIntent,
        getSignedResult,
        onSuccess,
        onError,
        onCancel,
        onClose,
      }),
    );

    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());
    const signingError = new Error("Not enough gas");

    act(() => {
      result.current.onIntentJobError(signingError);
      result.current.onUserCancel();
    });

    expect(onError).toHaveBeenCalledWith(signingError);
    expect(onCancel).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clears the last job error when a retry starts reconnecting", async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const onCancel = jest.fn();
    const onClose = jest.fn();
    const request = createRequest("req-error-retry");

    const { result } = renderHook(() =>
      useDeviceIntentSignRequest({
        request,
        prepare,
        createSignatureIntent: createTestSignatureIntent,
        getSignedResult,
        onSuccess,
        onError,
        onCancel,
        onClose,
      }),
    );

    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    act(() => {
      result.current.onIntentJobError(new Error("Device disconnected"));
      result.current.onExecutorStateChanged({ type: "connectingDevice" });
      result.current.onUserCancel();
    });

    expect(onError).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("settles only once when onUserCancel fires after onIntentJobComplete", async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const onCancel = jest.fn();
    const onClose = jest.fn();
    const request = createRequest("req-2b");

    const { result } = renderHook(() =>
      useDeviceIntentSignRequest({
        request,
        prepare,
        createSignatureIntent: createTestSignatureIntent,
        getSignedResult,
        onSuccess,
        onError,
        onCancel,
        onClose,
      }),
    );

    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    act(() => {
      result.current.onIntentJobStateChanged({ type: "signed", signature: "0xabc" });
    });
    act(() => {
      result.current.onIntentJobComplete();
      result.current.onUserCancel();
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith("0xabc");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("settles success on cancel when a signed result was already stored", async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const onCancel = jest.fn();
    const onClose = jest.fn();
    const request = createRequest("req-3");

    const { result } = renderHook(() =>
      useDeviceIntentSignRequest({
        request,
        prepare,
        createSignatureIntent: createTestSignatureIntent,
        getSignedResult,
        onSuccess,
        onError,
        onCancel,
        onClose,
      }),
    );

    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());
    expect(prepare).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.onIntentJobStateChanged({ type: "signed", signature: "0xdef" });
    });
    act(() => {
      result.current.onUserCancel();
    });

    expect(onSuccess).toHaveBeenCalledWith("0xdef");
    expect(onCancel).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when the user cancels before signing", async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const onCancel = jest.fn();
    const onClose = jest.fn();
    const request = createRequest("req-4");

    const { result } = renderHook(() =>
      useDeviceIntentSignRequest({
        request,
        prepare,
        createSignatureIntent: createTestSignatureIntent,
        getSignedResult,
        onSuccess,
        onError,
        onCancel,
        onClose,
      }),
    );

    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());
    expect(prepare).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.onUserCancel();
      result.current.onUserCancel();
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("rejects via onError when prepare fails", async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const onCancel = jest.fn();
    const onClose = jest.fn();
    const request = createRequest("req-5");
    prepare.mockRejectedValueOnce(new Error("prepare failed"));

    renderHook(() =>
      useDeviceIntentSignRequest({
        request,
        prepare,
        createSignatureIntent: createTestSignatureIntent,
        getSignedResult,
        onSuccess,
        onError,
        onCancel,
        onClose,
      }),
    );

    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.any(Error)));
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("re-prepares when the request changes", async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const onCancel = jest.fn();
    const onClose = jest.fn();

    const { result, rerender } = renderHook(
      ({ request }) =>
        useDeviceIntentSignRequest({
          request,
          prepare,
          createSignatureIntent: createTestSignatureIntent,
          getSignedResult,
          onSuccess,
          onError,
          onCancel,
          onClose,
        }),
      { initialProps: { request: createRequest("first") } },
    );

    await waitFor(() =>
      expect(result.current.deviceInitializationInput).toEqual({ appName: "Ethereum" }),
    );
    expect(mockedCreateIntent).toHaveBeenLastCalledWith(platformDefinition, { payload: "first" });

    rerender({ request: createRequest("second") });

    await waitFor(() =>
      expect(mockedCreateIntent).toHaveBeenLastCalledWith(platformDefinition, {
        payload: "second",
      }),
    );
    expect(prepare).toHaveBeenCalledTimes(2);
  });
});
