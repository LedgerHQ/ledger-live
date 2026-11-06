import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import {
  NoTrustchainInitialized,
  TrustchainAlreadyInitialized,
  TrustchainAlreadyInitializedWithOtherSeed,
  TrustchainNotAllowed,
} from "@ledgerhq/ledger-key-ring-protocol/errors";
import {
  TrustchainResultType,
  type GetOrCreateTrustchainCallbacks,
  type MemberCredentials,
  type Trustchain,
  type TrustchainResult,
  type TrustchainSDK,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import type { LedgerSyncJobState } from "../ledgerSyncJobState";
import { addMemberIntentJob } from "./job";

const MEMBER_CREDENTIALS: MemberCredentials = { pubkey: "pubkey", privatekey: "privatekey" };
const TRUSTCHAIN: Trustchain = {
  rootId: "root-id",
  applicationPath: "m/0'/16'/0'",
  walletSyncEncryptionKey: "key",
};
const RESULT: TrustchainResult = { type: TrustchainResultType.created, trustchain: TRUSTCHAIN };

const PENDING = { type: "pending" };
const AWAITING = {
  type: "awaiting-device-confirmation",
  deviceModelId: DeviceModelId.STAX,
  deviceName: "Ledger Stax",
};
const PROCESSING = { type: "processing" };
const COMPLETED = { type: "completed" };

const CONNECTION = {
  dmk: {} as never,
  sessionId: "session-1",
  connectedDevice: { modelId: DeviceModelId.STAX } as never,
  compatDeviceId: "compat-1",
  compatDeviceName: "Ledger Stax",
  compatDeviceWired: true,
} satisfies DeviceConnectionResult;

type GetOrCreateTrustchain = TrustchainSDK["getOrCreateTrustchain"];

function flush() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>(settle => {
    resolve = settle;
  });
  return { promise, resolve };
}

function namedError(name: string): Error {
  const error = new Error(name);
  error.name = name;
  return error;
}

/** A device call that asks for one confirmation, then settles with `outcome`. */
function deviceCall(
  outcome: () => Promise<TrustchainResult>,
): jest.MockedFunction<GetOrCreateTrustchain> {
  return jest.fn(async (_deviceId, _credentials, callbacks?: GetOrCreateTrustchainCallbacks) => {
    callbacks?.onStartRequestUserInteraction?.();
    try {
      return await outcome();
    } finally {
      callbacks?.onEndRequestUserInteraction?.();
    }
  });
}

function startJob(getOrCreateTrustchain: GetOrCreateTrustchain, currentTrustchain?: Trustchain) {
  const sdk = { getOrCreateTrustchain } as unknown as TrustchainSDK;
  const createSessionSdk = jest.fn(() => sdk);
  const onResult = jest.fn();
  const states: LedgerSyncJobState[] = [];
  const observer = { error: jest.fn(), complete: jest.fn() };

  const subscription = addMemberIntentJob({
    deviceConnectionResult: CONNECTION,
    deviceExtractedContext: {} as never,
    input: { memberCredentials: MEMBER_CREDENTIALS, currentTrustchain, createSessionSdk },
    onResult,
  }).subscribe({
    next: state => states.push(state),
    error: observer.error,
    complete: observer.complete,
  });

  return { states, onResult, observer, subscription, createSessionSdk };
}

describe("addMemberIntentJob", () => {
  it("should run the SDK call on the session and report the trustchain", async () => {
    const getOrCreateTrustchain = deviceCall(() => Promise.resolve(RESULT));
    const { states, onResult, observer, createSessionSdk } = startJob(
      getOrCreateTrustchain,
      TRUSTCHAIN,
    );

    await flush();

    expect(createSessionSdk).toHaveBeenCalledWith(CONNECTION);
    expect(getOrCreateTrustchain).toHaveBeenCalledWith(
      "compat-1",
      MEMBER_CREDENTIALS,
      expect.any(Object),
      undefined,
      TRUSTCHAIN,
    );
    expect(states).toEqual([PENDING, AWAITING, PROCESSING, COMPLETED]);
    expect(onResult).toHaveBeenCalledWith(RESULT);
    expect(observer.complete).toHaveBeenCalledTimes(1);
    expect(observer.error).not.toHaveBeenCalled();
  });

  it("should stay processing between and after device confirmations", async () => {
    const getOrCreateTrustchain = jest.fn(
      async (
        _deviceId: string,
        _credentials: MemberCredentials,
        callbacks?: GetOrCreateTrustchainCallbacks,
      ) => {
        callbacks?.onStartRequestUserInteraction?.();
        callbacks?.onEndRequestUserInteraction?.();
        callbacks?.onStartRequestUserInteraction?.();
        callbacks?.onEndRequestUserInteraction?.();
        return RESULT;
      },
    );
    const { states } = startJob(getOrCreateTrustchain);

    await flush();

    expect(states).toEqual([PENDING, AWAITING, PROCESSING, AWAITING, PROCESSING, COMPLETED]);
  });

  it("should emit device-rejected on refusal and re-run the call on the same SDK when retried", async () => {
    const getOrCreateTrustchain = deviceCall(() =>
      Promise.reject(namedError("UserRefusedOnDevice")),
    );
    const { states, onResult, observer, createSessionSdk } = startJob(getOrCreateTrustchain);

    await flush();

    const rejected = states.at(-1);
    expect(states.slice(0, 3)).toEqual([PENDING, AWAITING, PROCESSING]);
    expect(rejected).toMatchObject({ type: "device-rejected", error: expect.any(Error) });
    expect(observer.complete).not.toHaveBeenCalled();

    getOrCreateTrustchain.mockImplementation(deviceCall(() => Promise.resolve(RESULT)));
    (rejected as Extract<LedgerSyncJobState, { type: "device-rejected" }>).retry();
    await flush();

    expect(getOrCreateTrustchain).toHaveBeenCalledTimes(2);
    expect(createSessionSdk).toHaveBeenCalledTimes(1);
    expect(states.slice(4)).toEqual([PENDING, AWAITING, PROCESSING, COMPLETED]);
    expect(onResult).toHaveBeenCalledWith(RESULT);
    expect(observer.complete).toHaveBeenCalledTimes(1);
  });

  it("should start one call only when retry is invoked twice or after unsubscribe", async () => {
    const getOrCreateTrustchain = deviceCall(() =>
      Promise.reject(namedError("UserRefusedOnDevice")),
    );
    const { states, subscription } = startJob(getOrCreateTrustchain);
    await flush();
    const rejected = states.at(-1) as Extract<LedgerSyncJobState, { type: "device-rejected" }>;

    getOrCreateTrustchain.mockImplementation(() => new Promise<TrustchainResult>(() => undefined));
    rejected.retry();
    rejected.retry();
    expect(getOrCreateTrustchain).toHaveBeenCalledTimes(2);

    subscription.unsubscribe();
    rejected.retry();
    expect(getOrCreateTrustchain).toHaveBeenCalledTimes(2);
  });

  it.each([
    [new TrustchainAlreadyInitialized(), "already-secured-same-seed"],
    [new TrustchainAlreadyInitializedWithOtherSeed(), "already-secured-other-seed"],
    [new TrustchainNotAllowed(), "not-allowed"],
    [new NoTrustchainInitialized(), "no-trustchain"],
    [new Error("network down"), "unknown"],
  ] as const)("should end as failed when the SDK throws %s", async (error, reason) => {
    const { states, onResult, observer } = startJob(deviceCall(() => Promise.reject(error)));

    await flush();

    expect(states.at(-1)).toEqual({ type: "failed", reason, error });
    expect(onResult).not.toHaveBeenCalled();
    expect(observer.complete).toHaveBeenCalledTimes(1);
    expect(observer.error).not.toHaveBeenCalled();
  });

  it("should error the observable on a device disconnection so DIE shows its Disconnected screen", async () => {
    const disconnection = Object.assign(new Error("unplugged"), {
      _tag: "DeviceDisconnectedWhileSendingError",
    });
    const { states, onResult, observer } = startJob(
      deviceCall(() => Promise.reject(disconnection)),
    );

    await flush();

    expect(states).toEqual([PENDING, AWAITING, PROCESSING]);
    expect(observer.error).toHaveBeenCalledWith(disconnection);
    expect(observer.complete).not.toHaveBeenCalled();
    expect(onResult).not.toHaveBeenCalled();
  });

  it("should end as failed when the SDK throws synchronously", async () => {
    const error = new Error("sync");
    const { states, observer } = startJob(
      jest.fn(() => {
        throw error;
      }),
    );

    await flush();

    expect(states).toEqual([PENDING, { type: "failed", reason: "unknown", error }]);
    expect(observer.complete).toHaveBeenCalledTimes(1);
  });

  it("should end as failed when the session SDK cannot be built", () => {
    const error = new Error("no sdk");
    const onResult = jest.fn();
    const states: LedgerSyncJobState[] = [];
    const complete = jest.fn();

    addMemberIntentJob({
      deviceConnectionResult: CONNECTION,
      deviceExtractedContext: {} as never,
      input: {
        memberCredentials: MEMBER_CREDENTIALS,
        createSessionSdk: () => {
          throw error;
        },
      },
      onResult,
    }).subscribe({ next: state => states.push(state), complete });

    expect(states).toEqual([{ type: "failed", reason: "unknown", error }]);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("should emit nothing after unsubscribe", async () => {
    const { promise, resolve } = createDeferred<TrustchainResult>();
    const getOrCreateTrustchain = jest.fn(
      async (
        _deviceId: string,
        _credentials: MemberCredentials,
        callbacks?: GetOrCreateTrustchainCallbacks,
      ) => {
        const result = await promise;
        callbacks?.onStartRequestUserInteraction?.();
        callbacks?.onEndRequestUserInteraction?.();
        return result;
      },
    );
    const { states, onResult, observer, subscription } = startJob(getOrCreateTrustchain);

    subscription.unsubscribe();
    resolve(RESULT);
    await flush();

    expect(states).toEqual([PENDING]);
    expect(onResult).not.toHaveBeenCalled();
    expect(observer.complete).not.toHaveBeenCalled();
  });
});
