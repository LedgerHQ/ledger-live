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
  type MemberCredentials,
  type Trustchain,
  type TrustchainResult,
  type TrustchainSDK,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { lastValueFrom } from "rxjs";
import type {
  LedgerSyncAwaitingDeviceConfirmationJobState,
  LedgerSyncCompletedJobState,
  LedgerSyncPendingJobState,
  LedgerSyncProcessingJobState,
} from "../../jobState";
import {
  createDeferred,
  expectState,
  failedState,
  fakeTrustchainSdk,
  namedError,
  recordJob,
} from "../../internals/ledgerSyncJobTestKit";
import { addMemberIntentJob } from "./job";
import type { AddMemberIntentInput } from "./types";

type GetOrCreateTrustchain = TrustchainSDK["getOrCreateTrustchain"];

const MEMBER_CREDENTIALS: MemberCredentials = { pubkey: "pubkey", privatekey: "privatekey" };
const TRUSTCHAIN: Trustchain = {
  rootId: "root-id",
  applicationPath: "m/0'/16'/0'",
  walletSyncEncryptionKey: "key",
};
const RESULT: TrustchainResult = { type: TrustchainResultType.created, trustchain: TRUSTCHAIN };

const PENDING: LedgerSyncPendingJobState = { type: "pending" };
const AWAITING: LedgerSyncAwaitingDeviceConfirmationJobState = {
  type: "awaiting-device-confirmation",
  deviceModelId: DeviceModelId.STAX,
  deviceName: "Ledger Stax",
};
const PROCESSING: LedgerSyncProcessingJobState = { type: "processing" };
const COMPLETED: LedgerSyncCompletedJobState = { type: "completed" };

const CONNECTION = {
  dmk: {} as never,
  sessionId: "session-1",
  connectedDevice: { modelId: DeviceModelId.STAX } as never,
  compatDeviceId: "compat-1",
  compatDeviceName: "Ledger Stax",
  compatDeviceWired: true,
} satisfies DeviceConnectionResult;

/** A device call that asks for `confirmations` confirmations, then settles with `outcome`. */
function deviceCall(
  outcome: () => Promise<TrustchainResult>,
  confirmations = 1,
): jest.MockedFunction<GetOrCreateTrustchain> {
  return jest.fn<ReturnType<GetOrCreateTrustchain>, Parameters<GetOrCreateTrustchain>>(
    async (_deviceId, _credentials, callbacks) => {
      for (let confirmation = 1; confirmation < confirmations; confirmation++) {
        callbacks?.onStartRequestUserInteraction?.();
        callbacks?.onEndRequestUserInteraction?.();
      }
      callbacks?.onStartRequestUserInteraction?.();
      try {
        return await outcome();
      } finally {
        callbacks?.onEndRequestUserInteraction?.();
      }
    },
  );
}

type OnInitialResponse = AddMemberIntentInput["onInitialResponse"];

function createJob(
  getOrCreateTrustchain: GetOrCreateTrustchain,
  currentTrustchain?: Trustchain,
  onInitialResponse?: OnInitialResponse,
) {
  const createSessionSdk = jest.fn(() => fakeTrustchainSdk({ getOrCreateTrustchain }));
  const onResult = jest.fn();
  const job$ = addMemberIntentJob({
    deviceConnectionResult: CONNECTION,
    deviceExtractedContext: {} as never,
    input: {
      memberCredentials: MEMBER_CREDENTIALS,
      currentTrustchain,
      createSessionSdk,
      ...(onInitialResponse && { onInitialResponse }),
    },
    onResult,
  });
  return { job$, onResult, createSessionSdk };
}

function startJob(
  getOrCreateTrustchain: GetOrCreateTrustchain,
  currentTrustchain?: Trustchain,
  onInitialResponse?: OnInitialResponse,
) {
  const { job$, onResult, createSessionSdk } = createJob(
    getOrCreateTrustchain,
    currentTrustchain,
    onInitialResponse,
  );
  return { ...recordJob(job$), onResult, createSessionSdk };
}

describe("addMemberIntentJob", () => {
  it("should run the SDK call on the session and report the trustchain", async () => {
    const getOrCreateTrustchain = deviceCall(() => Promise.resolve(RESULT));
    const { ended, onResult, createSessionSdk } = startJob(getOrCreateTrustchain, TRUSTCHAIN);

    expect(await ended()).toEqual([PENDING, AWAITING, PROCESSING, COMPLETED]);
    expect(createSessionSdk).toHaveBeenCalledWith(CONNECTION);
    expect(getOrCreateTrustchain).toHaveBeenCalledWith(
      "compat-1",
      MEMBER_CREDENTIALS,
      expect.any(Object),
      undefined,
      TRUSTCHAIN,
    );
    expect(onResult).toHaveBeenCalledWith(RESULT);
  });

  it("should stay processing between and after device confirmations", async () => {
    const { ended } = startJob(deviceCall(() => Promise.resolve(RESULT), 2));

    expect(await ended()).toEqual([PENDING, AWAITING, PROCESSING, AWAITING, PROCESSING, COMPLETED]);
  });

  it("should emit device-rejected on refusal and re-run the call on the same SDK when retried", async () => {
    const getOrCreateTrustchain = deviceCall(() =>
      Promise.reject(namedError("UserRefusedOnDevice")),
    );
    const { states, waitFor, ended, onResult, createSessionSdk } = startJob(getOrCreateTrustchain);

    const rejected = await waitFor("device-rejected");

    expect(states).toEqual([PENDING, AWAITING, PROCESSING, rejected]);
    expect(rejected.error).toBeInstanceOf(Error);

    getOrCreateTrustchain.mockImplementation(deviceCall(() => Promise.resolve(RESULT)));
    rejected.retry();

    expect((await ended()).slice(4)).toEqual([PENDING, AWAITING, PROCESSING, COMPLETED]);
    expect(getOrCreateTrustchain).toHaveBeenCalledTimes(2);
    expect(createSessionSdk).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(RESULT);
  });

  it("should start one call only when retry is invoked twice or after unsubscribe", async () => {
    const getOrCreateTrustchain = deviceCall(() =>
      Promise.reject(namedError("UserRefusedOnDevice")),
    );
    const { states, waitFor, subscription } = startJob(getOrCreateTrustchain);
    await waitFor("device-rejected");
    const rejected = expectState(states.at(-1), "device-rejected");

    getOrCreateTrustchain.mockImplementation(() => createDeferred<TrustchainResult>().promise);
    rejected.retry();
    rejected.retry();
    expect(getOrCreateTrustchain).toHaveBeenCalledTimes(2);

    subscription.unsubscribe();
    rejected.retry();
    expect(getOrCreateTrustchain).toHaveBeenCalledTimes(2);
  });

  it("should pass onInitialResponse to the SDK with the device callbacks", async () => {
    const onInitialResponse = jest.fn();
    const getOrCreateTrustchain = deviceCall(() => Promise.resolve(RESULT));
    const { ended } = startJob(getOrCreateTrustchain, undefined, onInitialResponse);

    expect(await ended()).toEqual([PENDING, AWAITING, PROCESSING, COMPLETED]);
    expect(getOrCreateTrustchain).toHaveBeenCalledWith(
      "compat-1",
      MEMBER_CREDENTIALS,
      {
        onStartRequestUserInteraction: expect.any(Function),
        onEndRequestUserInteraction: expect.any(Function),
        onInitialResponse,
      },
      undefined,
      undefined,
    );
  });

  it("should end as failed with no-trustchain when onInitialResponse throws NoTrustchainInitialized", async () => {
    const error = new NoTrustchainInitialized();
    const getOrCreateTrustchain = jest.fn<
      ReturnType<GetOrCreateTrustchain>,
      Parameters<GetOrCreateTrustchain>
    >(async (_deviceId, _credentials, callbacks) => {
      callbacks?.onInitialResponse?.({});
      return RESULT;
    });
    const { ended, onResult } = startJob(getOrCreateTrustchain, undefined, () => {
      throw error;
    });

    expect(await ended()).toEqual([PENDING, failedState("no-trustchain", error)]);
    expect(onResult).not.toHaveBeenCalled();
  });

  it("should pass the device callbacks only when onInitialResponse is not given", async () => {
    const getOrCreateTrustchain = deviceCall(() => Promise.resolve(RESULT));
    const { ended } = startJob(getOrCreateTrustchain);

    await ended();
    expect(getOrCreateTrustchain.mock.calls[0][2]).not.toHaveProperty("onInitialResponse");
  });

  it.each([
    [new TrustchainAlreadyInitialized(), "already-secured-same-seed"],
    [new TrustchainAlreadyInitializedWithOtherSeed(), "already-secured-other-seed"],
    [new TrustchainNotAllowed(), "not-allowed"],
    [new NoTrustchainInitialized(), "no-trustchain"],
    [new Error("network down"), "unknown"],
  ] as const)("should end as failed when the SDK throws %s", async (error, reason) => {
    const { ended, onResult } = startJob(deviceCall(() => Promise.reject(error)));

    expect((await ended()).at(-1)).toEqual(failedState(reason, error));
    expect(onResult).not.toHaveBeenCalled();
  });

  it("should error the observable on a device disconnection so DIE shows its Disconnected screen", async () => {
    const disconnection = Object.assign(new Error("unplugged"), {
      _tag: "DeviceDisconnectedWhileSendingError",
    });
    const { states, ended, onResult } = startJob(deviceCall(() => Promise.reject(disconnection)));

    await expect(ended()).rejects.toBe(disconnection);
    expect(states).toEqual([PENDING, AWAITING, PROCESSING]);
    expect(onResult).not.toHaveBeenCalled();
  });

  it("should end as failed when the SDK throws synchronously", async () => {
    const error = new Error("sync");
    const getOrCreateTrustchain = jest.fn<
      ReturnType<GetOrCreateTrustchain>,
      Parameters<GetOrCreateTrustchain>
    >(() => {
      throw error;
    });
    const { ended } = startJob(getOrCreateTrustchain);

    expect(await ended()).toEqual([PENDING, failedState("unknown", error)]);
  });

  it("should end as failed when the session SDK cannot be built", async () => {
    const error = new Error("no sdk");
    const onResult = jest.fn();

    const { ended } = recordJob(
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
      }),
    );

    expect(await ended()).toEqual([failedState("unknown", error)]);
    expect(onResult).not.toHaveBeenCalled();
  });

  it("should emit no state but still report the result after unsubscribe", async () => {
    const deviceAnswer = createDeferred<TrustchainResult>();
    const getOrCreateTrustchain = jest.fn<
      ReturnType<GetOrCreateTrustchain>,
      Parameters<GetOrCreateTrustchain>
    >(async (_deviceId, _credentials, callbacks) => {
      const result = await deviceAnswer.promise;
      callbacks?.onStartRequestUserInteraction?.();
      callbacks?.onEndRequestUserInteraction?.();
      return result;
    });
    const cancelled = startJob(getOrCreateTrustchain);
    // A second run on the same device answer settles after the cancelled one, so awaiting it
    // proves the cancelled run's handlers already ran.
    const witness = createJob(getOrCreateTrustchain);
    const witnessEnded = lastValueFrom(witness.job$);

    cancelled.subscription.unsubscribe();
    deviceAnswer.resolve(RESULT);
    await witnessEnded;

    expect(witness.onResult).toHaveBeenCalledWith(RESULT);
    expect(cancelled.states).toEqual([PENDING]);
    expect(cancelled.onResult).toHaveBeenCalledTimes(1);
    expect(cancelled.onResult).toHaveBeenCalledWith(RESULT);
  });
});
