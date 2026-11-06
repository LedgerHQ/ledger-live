import type { DeviceConnectionResult } from "@features/platform-device-intent";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { TrustchainNotAllowed } from "@ledgerhq/ledger-key-ring-protocol/errors";
import { lastValueFrom, Observable, toArray, type Subscriber } from "rxjs";
import type { LedgerSyncJobState } from "../ledgerSyncJobState";
import {
  completeJob,
  createDeviceCallbacks,
  createLedgerSyncJob,
  failJob,
  handleCallError,
  tryCreateSessionSdk,
} from "./createLedgerSyncJob";
import { fakeTrustchainSdk, namedError } from "./ledgerSyncJobTestKit";

const CONNECTION = {
  dmk: {} as never,
  sessionId: "session-1",
  connectedDevice: { modelId: DeviceModelId.NANO_X } as never,
  compatDeviceId: "compat-1",
  compatDeviceName: "Ledger Nano X",
  compatDeviceWired: true,
} satisfies DeviceConnectionResult;

const SDK = fakeTrustchainSdk({});

/** A real subscriber whose notifications land in jest mocks. */
function fakeSubscriber() {
  const observer = { next: jest.fn(), complete: jest.fn(), error: jest.fn() };
  let captured: Subscriber<LedgerSyncJobState> | undefined;
  new Observable<LedgerSyncJobState>(subscriber => {
    captured = subscriber;
  }).subscribe(observer);
  if (!captured) throw new Error("The observable did not hand over its subscriber");
  return { ...observer, asSubscriber: captured };
}

describe("failJob", () => {
  it("should emit the mapped failure, then complete", () => {
    const subscriber = fakeSubscriber();
    const error = new TrustchainNotAllowed();

    failJob(subscriber.asSubscriber, error);

    expect(subscriber.next).toHaveBeenCalledWith({ type: "failed", reason: "not-allowed", error });
    expect(subscriber.complete).toHaveBeenCalledTimes(1);
    expect(subscriber.next.mock.invocationCallOrder[0]).toBeLessThan(
      subscriber.complete.mock.invocationCallOrder[0],
    );
  });
});

describe("completeJob", () => {
  it("should report the result before emitting completed, then complete", () => {
    const subscriber = fakeSubscriber();
    const onResult = jest.fn();

    completeJob(subscriber.asSubscriber, onResult, "result");

    expect(onResult).toHaveBeenCalledWith("result");
    expect(subscriber.next).toHaveBeenCalledWith({ type: "completed" });
    expect(subscriber.complete).toHaveBeenCalledTimes(1);
    expect(onResult.mock.invocationCallOrder[0]).toBeLessThan(
      subscriber.next.mock.invocationCallOrder[0],
    );
  });

  it("should error the observable when onResult throws, so the job still ends", () => {
    const subscriber = fakeSubscriber();
    const hostError = new Error("host failed");

    completeJob(
      subscriber.asSubscriber,
      () => {
        throw hostError;
      },
      "result",
    );

    expect(subscriber.error).toHaveBeenCalledWith(hostError);
    expect(subscriber.next).not.toHaveBeenCalled();
    expect(subscriber.complete).not.toHaveBeenCalled();
  });
});

describe("tryCreateSessionSdk", () => {
  it("should return the SDK built for the session", () => {
    const subscriber = fakeSubscriber();
    const createSessionSdk = jest.fn(() => SDK);

    expect(tryCreateSessionSdk(createSessionSdk, CONNECTION, subscriber.asSubscriber)).toBe(SDK);
    expect(createSessionSdk).toHaveBeenCalledWith(CONNECTION);
    expect(subscriber.next).not.toHaveBeenCalled();
  });

  it("should fail the job and return undefined when the SDK cannot be built", () => {
    const subscriber = fakeSubscriber();
    const error = new Error("no sdk");

    const sdk = tryCreateSessionSdk(
      () => {
        throw error;
      },
      CONNECTION,
      subscriber.asSubscriber,
    );

    expect(sdk).toBeUndefined();
    expect(subscriber.next).toHaveBeenCalledWith({ type: "failed", reason: "unknown", error });
    expect(subscriber.complete).toHaveBeenCalledTimes(1);
  });
});

describe("createDeviceCallbacks", () => {
  it("should emit awaiting-device-confirmation with the device model and name on start", () => {
    const subscriber = fakeSubscriber();
    const callbacks = createDeviceCallbacks(subscriber.asSubscriber, CONNECTION, () => true);

    callbacks.onStartRequestUserInteraction?.();

    expect(subscriber.next).toHaveBeenCalledWith({
      type: "awaiting-device-confirmation",
      deviceModelId: DeviceModelId.NANO_X,
      deviceName: "Ledger Nano X",
    });
  });

  it("should emit processing on end", () => {
    const subscriber = fakeSubscriber();
    const callbacks = createDeviceCallbacks(subscriber.asSubscriber, CONNECTION, () => true);

    callbacks.onEndRequestUserInteraction?.();

    expect(subscriber.next).toHaveBeenCalledWith({ type: "processing" });
  });

  it("should emit nothing once the run is no longer current", () => {
    const subscriber = fakeSubscriber();
    const callbacks = createDeviceCallbacks(subscriber.asSubscriber, CONNECTION, () => false);

    callbacks.onStartRequestUserInteraction?.();
    callbacks.onEndRequestUserInteraction?.();

    expect(subscriber.next).not.toHaveBeenCalled();
  });
});

describe("handleCallError", () => {
  it("should error the observable on a device disconnection", () => {
    const subscriber = fakeSubscriber();
    const disconnection = Object.assign(new Error("unplugged"), {
      _tag: "DeviceDisconnectedWhileSendingError",
    });

    handleCallError(subscriber.asSubscriber, disconnection, jest.fn());

    expect(subscriber.error).toHaveBeenCalledWith(disconnection);
    expect(subscriber.next).not.toHaveBeenCalled();
    expect(subscriber.complete).not.toHaveBeenCalled();
  });

  it("should emit device-rejected with the given retry on a refusal, without completing", () => {
    const subscriber = fakeSubscriber();
    const refusal = namedError("UserRefusedOnDevice");
    const retry = jest.fn();

    handleCallError(subscriber.asSubscriber, refusal, retry);

    expect(subscriber.next).toHaveBeenCalledWith({
      type: "device-rejected",
      error: refusal,
      retry,
    });
    expect(subscriber.complete).not.toHaveBeenCalled();
    expect(retry).not.toHaveBeenCalled();
  });

  it("should fail the job on any other error", () => {
    const subscriber = fakeSubscriber();
    const error = new TrustchainNotAllowed();

    handleCallError(subscriber.asSubscriber, error, jest.fn());

    expect(subscriber.next).toHaveBeenCalledWith({ type: "failed", reason: "not-allowed", error });
    expect(subscriber.complete).toHaveBeenCalledTimes(1);
    expect(subscriber.error).not.toHaveBeenCalled();
  });
});

describe("createLedgerSyncJob", () => {
  it("should call the device call with the session SDK, the compat device id, the input and the callbacks", async () => {
    const call = jest.fn(async () => "result");
    const onResult = jest.fn();
    const input = { createSessionSdk: () => SDK, value: 42 };

    const states = await lastValueFrom(
      createLedgerSyncJob(call)({
        deviceConnectionResult: CONNECTION,
        deviceExtractedContext: {} as never,
        input,
        onResult,
      }).pipe(toArray()),
    );

    expect(call).toHaveBeenCalledWith({
      sdk: SDK,
      deviceId: "compat-1",
      input,
      callbacks: {
        onStartRequestUserInteraction: expect.any(Function),
        onEndRequestUserInteraction: expect.any(Function),
      },
    });
    expect(onResult).toHaveBeenCalledWith("result");
    expect(states).toEqual([{ type: "pending" }, { type: "completed" }]);
  });
});
