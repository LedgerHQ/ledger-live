import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { hyperliquidSignIntentJob } from "./job";
import type {
  HyperliquidSignature,
  HyperliquidSignIntentJobState,
  HyperliquidSignIntentResult,
  SignHyperliquidActionsOnSession,
} from "./types";

const SIGNATURES: HyperliquidSignature[] = [{ r: "0xr", s: "0xs", v: 27 }];
const SIGNING: HyperliquidSignIntentJobState = {
  type: "signing",
  deviceModelId: DeviceModelId.FLEX,
  deviceName: "Ledger Flex",
};
const DMK = { id: "dmk" };
const CONNECTED_DEVICE = { modelId: DeviceModelId.FLEX };

class UserRefusedOnDevice extends Error {
  override name = "UserRefusedOnDevice";
}

function startJob(signOnSession: SignHyperliquidActionsOnSession) {
  const states: HyperliquidSignIntentJobState[] = [];
  const onResult = jest.fn<void, [HyperliquidSignIntentResult]>();
  let error: unknown;
  let completed = false;

  const subscription = hyperliquidSignIntentJob({
    deviceConnectionResult: {
      dmk: DMK as never,
      sessionId: "session-1",
      connectedDevice: CONNECTED_DEVICE as never,
      compatDeviceId: "compat-1",
      compatDeviceName: "Ledger Flex",
      compatDeviceWired: true,
    },
    deviceExtractedContext: {} as never,
    input: { signOnSession },
    onResult,
  }).subscribe({
    next: state => states.push(state),
    error: e => {
      error = e;
    },
    complete: () => {
      completed = true;
    },
  });

  return {
    states,
    onResult,
    subscription,
    isCompleted: () => completed,
    getError: () => error,
  };
}

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

describe("hyperliquidSignIntentJob", () => {
  it("emits signing synchronously with the connected device", () => {
    const { states } = startJob(() => new Promise(() => {}));

    expect(states).toEqual([SIGNING]);
  });

  it("hands the session to the injected signer", async () => {
    const signOnSession = jest.fn().mockResolvedValue(SIGNATURES);

    startJob(signOnSession);
    await flushPromises();

    expect(signOnSession).toHaveBeenCalledWith({
      dmk: DMK,
      sessionId: "session-1",
      connectedDevice: CONNECTED_DEVICE,
    });
  });

  it("reports the signatures once and completes", async () => {
    const { states, onResult, isCompleted } = startJob(() => Promise.resolve(SIGNATURES));
    await flushPromises();

    expect(states).toEqual([SIGNING, { type: "signed" }]);
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith({ type: "signed", signatures: SIGNATURES });
    expect(isCompleted()).toBe(true);
  });

  it("reports a refusal on the device as refused and completes", async () => {
    const refusal = new UserRefusedOnDevice();
    const { states, onResult, isCompleted } = startJob(() => Promise.reject(refusal));
    await flushPromises();

    expect(states).toEqual([SIGNING, { type: "refused" }]);
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith({ type: "refused", error: refusal });
    expect(isCompleted()).toBe(true);
  });

  it("reports any other failure as failed and completes", async () => {
    const failure = new Error("certificate not found");
    const { states, onResult, isCompleted } = startJob(() => Promise.reject(failure));
    await flushPromises();

    expect(states).toEqual([SIGNING, { type: "error", error: failure }]);
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith({ type: "failed", error: failure });
    expect(isCompleted()).toBe(true);
  });

  it("reports a signer that throws synchronously as failed", async () => {
    const failure = new Error("boom");
    const { onResult, isCompleted } = startJob(() => {
      throw failure;
    });
    await flushPromises();

    expect(onResult).toHaveBeenCalledWith({ type: "failed", error: failure });
    expect(isCompleted()).toBe(true);
  });

  it("turns a DMK error object into an Error carrying its tag", async () => {
    const dmkError = { _tag: "HyperliquidAppCommandError", errorCode: "6a80" };
    const { states, onResult } = startJob(() => Promise.reject(dmkError));
    await flushPromises();

    const [result] = onResult.mock.calls[0];
    expect(result.type).toBe("failed");
    const error = (result as Extract<HyperliquidSignIntentResult, { type: "failed" }>).error;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("HyperliquidAppCommandError");
    expect(error.cause).toBe(dmkError);
    expect(states[1]).toEqual({ type: "error", error });
  });

  it("lets a disconnection escape to the executor without reporting a result", async () => {
    const disconnection = { _tag: "DeviceDisconnectedWhileSendingError" };
    const { states, onResult, getError, isCompleted } = startJob(() =>
      Promise.reject(disconnection),
    );
    await flushPromises();

    expect(states).toEqual([SIGNING]);
    expect(onResult).not.toHaveBeenCalled();
    expect(getError()).toBe(disconnection);
    expect(isCompleted()).toBe(false);
  });

  it("reports nothing once unsubscribed", async () => {
    let resolveSignatures!: (signatures: HyperliquidSignature[]) => void;
    const { states, onResult, subscription } = startJob(
      () =>
        new Promise(resolve => {
          resolveSignatures = resolve;
        }),
    );

    subscription.unsubscribe();
    resolveSignatures(SIGNATURES);
    await flushPromises();

    expect(states).toEqual([SIGNING]);
    expect(onResult).not.toHaveBeenCalled();
  });
});
