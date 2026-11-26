import { act, renderHook, waitFor } from "@testing-library/react";
import { createIntent, type IntentPlatformDefinition } from "@features/platform-device-intent";
import { useDeviceIntentSignRequest } from "../useDeviceIntentSignRequest";

jest.mock("@features/platform-device-intent", () => ({
  createIntent: jest.fn(() => ({ uuid: "intent-1" })),
}));

const mockedCreateIntent = jest.mocked(createIntent);

type TestRequest = Readonly<{ id: string }>;
type TestJobState = { type: "pending" } | { type: "signed" } | { type: "cancelled" };
type TestIntentInput = Readonly<{ payload: string }>;
type TestInitInput = Readonly<{ appName: string }>;
type TestResult = string;

const platformDefinition: IntentPlatformDefinition<
  TestJobState,
  TestIntentInput,
  undefined,
  TestResult
> = {
  label: "Test sign",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: true,
  job: () => {
    throw new Error("job should not run in this test");
  },
  component: () => null,
};

let reportSignedResult: ((result: TestResult) => void) | undefined;

function createTestSignatureIntent(input: TestIntentInput, onResult: (result: TestResult) => void) {
  reportSignedResult = onResult;
  return createIntent(platformDefinition, input, { onResult });
}

function createRequest(id: string): TestRequest {
  return { id };
}

const prepare = jest.fn(async (request: TestRequest) => ({
  deviceInitializationInput: { appName: "Ethereum" } satisfies TestInitInput,
  intentInput: { payload: request.id } satisfies TestIntentInput,
}));

function renderSignRequest(initialRequest: TestRequest) {
  const callbacks = {
    onSuccess: jest.fn(),
    onError: jest.fn(),
    onCancel: jest.fn(),
    onClose: jest.fn(),
  };
  const rendered = renderHook(
    ({ request }) =>
      useDeviceIntentSignRequest({
        request,
        prepare,
        createSignatureIntent: createTestSignatureIntent,
        ...callbacks,
      }),
    { initialProps: { request: initialRequest } },
  );
  return { ...rendered, ...callbacks };
}

async function renderPreparedSignRequest(id: string) {
  const rendered = renderSignRequest(createRequest(id));
  await waitFor(() => expect(rendered.result.current.signatureIntent).not.toBeNull());
  return rendered;
}

function reportSignature(signature: TestResult) {
  if (!reportSignedResult) throw new Error("the intent was not created");
  reportSignedResult(signature);
}

describe("useDeviceIntentSignRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reportSignedResult = undefined;
    prepare.mockImplementation(async (request: TestRequest) => ({
      deviceInitializationInput: { appName: "Ethereum" },
      intentInput: { payload: request.id },
    }));
  });

  it("prepares device input then creates the intent with a result listener", async () => {
    const request = createRequest("req-1");
    const { result } = renderSignRequest(request);

    await waitFor(() =>
      expect(result.current.deviceInitializationInput).toEqual({ appName: "Ethereum" }),
    );
    expect(prepare).toHaveBeenCalledWith(request);
    expect(mockedCreateIntent).toHaveBeenCalledWith(
      platformDefinition,
      { payload: "req-1" },
      { onResult: expect.any(Function) },
    );
    expect(result.current.signatureIntent).toEqual({ uuid: "intent-1" });
  });

  it("defers success until onIntentJobComplete", async () => {
    const { result, onSuccess, onClose, onCancel } = await renderPreparedSignRequest("req-2");

    act(() => reportSignature("0xabc"));

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    act(() => result.current.onIntentJobComplete());

    expect(onSuccess).toHaveBeenCalledWith("0xabc");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("does not read the signed result from the job state", async () => {
    const { result, onSuccess, onError } = await renderPreparedSignRequest("req-job-state");

    act(() => {
      result.current.onIntentJobStateChanged({ type: "signed" });
      result.current.onIntentJobComplete();
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("rejects via onError and closes if onIntentJobComplete fires without a signed result", async () => {
    const { result, onSuccess, onError, onClose } = await renderPreparedSignRequest("req-2-empty");

    act(() => result.current.onIntentJobComplete());

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("rejects with the last job error when cancelled after an intent error", async () => {
    const { result, onError, onCancel, onClose } =
      await renderPreparedSignRequest("req-error-cancel");
    const signingError = new Error("Not enough gas");

    act(() => {
      result.current.onIntentJobError(signingError);
      result.current.onUserCancel(null);
    });

    expect(onError).toHaveBeenCalledWith(signingError);
    expect(onCancel).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clears the last job error when a retry emits a job state", async () => {
    const { result, onError, onCancel } = await renderPreparedSignRequest("req-error-job-retry");

    act(() => {
      result.current.onIntentJobError(new Error("Not enough gas"));
      result.current.onIntentJobStateChanged({ type: "pending" });
      result.current.onUserCancel(null);
    });

    expect(onError).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("clears the last job error when a retry starts reconnecting", async () => {
    const { result, onError, onCancel, onClose } =
      await renderPreparedSignRequest("req-error-retry");

    act(() => {
      result.current.onIntentJobError(new Error("Device disconnected"));
      result.current.onExecutorStateChanged({ type: "connectingDevice" });
      result.current.onUserCancel(null);
    });

    expect(onError).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("rejects with the executor failure when the user closes a failed connection", async () => {
    const { result, onError, onCancel, onClose } = await renderPreparedSignRequest("req-failure");

    act(() =>
      result.current.onUserCancel({
        failureType: "WrongDeviceForAccount",
        countsAsFailure: true,
      }),
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "WrongDeviceForAccount", message: "WrongDeviceForAccount" }),
    );
    expect(onCancel).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("uses the failure sub error as the message", async () => {
    const { result, onError } = await renderPreparedSignRequest("req-failure-sub-error");

    act(() =>
      result.current.onUserCancel({
        failureType: "ConnectAppError",
        countsAsFailure: true,
        subError: "TransportStatusError",
      }),
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "ConnectAppError", message: "TransportStatusError" }),
    );
  });

  it("cancels when the user closes a retryable executor screen", async () => {
    const { result, onError, onCancel } = await renderPreparedSignRequest("req-retryable");

    act(() => result.current.onUserCancel({ failureType: "DeviceLocked", countsAsFailure: false }));

    expect(onError).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("prefers the job error over the executor failure", async () => {
    const { result, onError } = await renderPreparedSignRequest("req-job-error-first");
    const signingError = new Error("Not enough gas");

    act(() => {
      result.current.onIntentJobError(signingError);
      result.current.onUserCancel({ failureType: "ConnectAppError", countsAsFailure: true });
    });

    expect(onError).toHaveBeenCalledWith(signingError);
  });

  it("settles only once when onUserCancel fires after onIntentJobComplete", async () => {
    const { result, onSuccess, onClose, onCancel } = await renderPreparedSignRequest("req-2b");

    act(() => reportSignature("0xabc"));
    act(() => {
      result.current.onIntentJobComplete();
      result.current.onUserCancel(null);
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith("0xabc");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("settles success on cancel when a signed result was already reported", async () => {
    const { result, onSuccess, onCancel, onClose } = await renderPreparedSignRequest("req-3");

    act(() => reportSignature("0xdef"));
    act(() =>
      result.current.onUserCancel({ failureType: "DeviceDisconnected", countsAsFailure: true }),
    );

    expect(onSuccess).toHaveBeenCalledWith("0xdef");
    expect(onCancel).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel once when the user cancels before signing", async () => {
    const { result, onSuccess, onCancel, onClose } = await renderPreparedSignRequest("req-4");

    act(() => {
      result.current.onUserCancel();
      result.current.onUserCancel();
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("rejects via onError when prepare fails", async () => {
    prepare.mockRejectedValueOnce(new Error("prepare failed"));
    const { onSuccess, onError, onClose } = renderSignRequest(createRequest("req-5"));

    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.any(Error)));
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("re-prepares when the request changes", async () => {
    const { result, rerender } = renderSignRequest(createRequest("first"));

    await waitFor(() =>
      expect(result.current.deviceInitializationInput).toEqual({ appName: "Ethereum" }),
    );
    expect(mockedCreateIntent).toHaveBeenLastCalledWith(
      platformDefinition,
      { payload: "first" },
      { onResult: expect.any(Function) },
    );

    rerender({ request: createRequest("second") });

    await waitFor(() =>
      expect(mockedCreateIntent).toHaveBeenLastCalledWith(
        platformDefinition,
        { payload: "second" },
        { onResult: expect.any(Function) },
      ),
    );
    expect(prepare).toHaveBeenCalledTimes(2);
  });
});
