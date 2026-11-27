import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import type { KeyRingTreeRecord } from "@domain/entity-key-ring";
import {
  mockKeyRingMemberKeyRecord,
  mockKeyRingTreeRecord,
} from "@domain/entity-key-ring/schema.mock";
import {
  NoTrustchainInitialized,
  TrustchainAlreadyInitialized,
  TrustchainAlreadyInitializedWithOtherSeed,
  TrustchainNotAllowed,
} from "@ledgerhq/ledger-key-ring-protocol/errors";
import {
  TrustchainResultType,
  type TrustchainResult,
  type TrustchainSDK,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { lastValueFrom } from "rxjs";
import { createLedgerSyncResultOrder } from "../ledgerSyncResultOrder";
import type {
  LedgerSyncAwaitingDeviceConfirmationJobState,
  LedgerSyncCompletedJobState,
  LedgerSyncPendingJobState,
  LedgerSyncProcessingJobState,
} from "../jobState";
import type { KeyRingActivation } from "../../types";
import { sessionOf, treeRecordOf } from "../../internals/handles";
import {
  createDeferred,
  expectState,
  failedState,
  fakeAppClient,
  namedError,
  recordJob,
} from "../../internals/ledgerSyncJobTestKit";
import { fakeKeyRingClient } from "../../testing";
import { addMemberIntentJob } from "./job";

type GetOrCreateTrustchain = TrustchainSDK["getOrCreateTrustchain"];

const MEMBER_CREDENTIALS = mockKeyRingMemberKeyRecord();
const TRUSTCHAIN = mockKeyRingTreeRecord();
const RESULT: TrustchainResult = { type: TrustchainResultType.created, trustchain: TRUSTCHAIN };
const REPORTED = { outcome: "created", tree: TRUSTCHAIN };

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
  compatDeviceId: "session-1",
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

function reported(onResult: jest.Mock<void, [KeyRingActivation]>) {
  return onResult.mock.calls.map(([activation]) => ({
    outcome: activation.outcome,
    tree: treeRecordOf(activation.tree),
  }));
}

function createJob(
  getOrCreateTrustchain: GetOrCreateTrustchain,
  currentTrustchain?: KeyRingTreeRecord,
  allowTreeCreation?: boolean,
) {
  const client = fakeAppClient({ getOrCreateTrustchain });
  const forDeviceSession = jest.spyOn(client, "forDeviceSession");
  const onResult = jest.fn<void, [KeyRingActivation]>();
  const job$ = addMemberIntentJob({
    deviceConnectionResult: CONNECTION,
    deviceExtractedContext: {} as never,
    input: {
      session: sessionOf({
        trustchain: currentTrustchain ?? null,
        memberCredentials: MEMBER_CREDENTIALS,
      }),
      client,
      resultOrder: createLedgerSyncResultOrder(),
      ...(allowTreeCreation !== undefined && { allowTreeCreation }),
    },
    onResult,
  });
  return { job$, onResult, forDeviceSession };
}

function startJob(
  getOrCreateTrustchain: GetOrCreateTrustchain,
  currentTrustchain?: KeyRingTreeRecord,
  allowTreeCreation?: boolean,
) {
  const { job$, onResult, forDeviceSession } = createJob(
    getOrCreateTrustchain,
    currentTrustchain,
    allowTreeCreation,
  );
  return { ...recordJob(job$), onResult, forDeviceSession };
}

describe("addMemberIntentJob", () => {
  it("should run the SDK call on the session client and report the key tree", async () => {
    const getOrCreateTrustchain = deviceCall(() => Promise.resolve(RESULT));
    const { ended, onResult, forDeviceSession } = startJob(getOrCreateTrustchain, TRUSTCHAIN);

    expect(await ended()).toEqual([PENDING, AWAITING, PROCESSING, COMPLETED]);
    expect(forDeviceSession).toHaveBeenCalledWith({ dmk: CONNECTION.dmk, sessionId: "session-1" });
    expect(getOrCreateTrustchain).toHaveBeenCalledWith(
      "session-1",
      MEMBER_CREDENTIALS,
      expect.any(Object),
      undefined,
      TRUSTCHAIN,
    );
    expect(reported(onResult)).toEqual([REPORTED]);
  });

  it("should stay processing between and after device confirmations", async () => {
    const { ended } = startJob(deviceCall(() => Promise.resolve(RESULT), 2));

    expect(await ended()).toEqual([PENDING, AWAITING, PROCESSING, AWAITING, PROCESSING, COMPLETED]);
  });

  it("should emit device-rejected on refusal and re-run the call on the same client when retried", async () => {
    const getOrCreateTrustchain = deviceCall(() =>
      Promise.reject(namedError("UserRefusedOnDevice")),
    );
    const { states, waitFor, ended, onResult, forDeviceSession } = startJob(getOrCreateTrustchain);

    const rejected = await waitFor("device-rejected");

    expect(states).toEqual([PENDING, AWAITING, PROCESSING, rejected]);
    expect(rejected.error).toBeInstanceOf(Error);

    getOrCreateTrustchain.mockImplementation(deviceCall(() => Promise.resolve(RESULT)));
    rejected.retry();

    expect((await ended()).slice(4)).toEqual([PENDING, AWAITING, PROCESSING, COMPLETED]);
    expect(getOrCreateTrustchain).toHaveBeenCalledTimes(2);
    expect(forDeviceSession).toHaveBeenCalledTimes(1);
    expect(reported(onResult)).toEqual([REPORTED]);
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

  it("should pass a seed check to the SDK with the device callbacks when tree creation is not allowed", async () => {
    const getOrCreateTrustchain = deviceCall(() => Promise.resolve(RESULT));
    const { ended } = startJob(getOrCreateTrustchain, undefined, false);

    expect(await ended()).toEqual([PENDING, AWAITING, PROCESSING, COMPLETED]);
    expect(getOrCreateTrustchain).toHaveBeenCalledWith(
      "session-1",
      MEMBER_CREDENTIALS,
      {
        onStartRequestUserInteraction: expect.any(Function),
        onEndRequestUserInteraction: expect.any(Function),
        onInitialResponse: expect.any(Function),
      },
      undefined,
      undefined,
    );
  });

  it("should end as failed with no-trustchain when tree creation is not allowed and the seed has no key tree", async () => {
    const getOrCreateTrustchain = jest.fn<
      ReturnType<GetOrCreateTrustchain>,
      Parameters<GetOrCreateTrustchain>
    >(async (_deviceId, _credentials, callbacks) => {
      callbacks?.onInitialResponse?.({});
      return RESULT;
    });
    const { ended, onResult } = startJob(getOrCreateTrustchain, undefined, false);

    expect(await ended()).toEqual([
      PENDING,
      {
        type: "failed",
        reason: "no-trustchain",
        error: expect.objectContaining({ category: "no-tree-for-seed" }),
      },
    ]);
    expect(onResult).not.toHaveBeenCalled();
  });

  it("should join the key tree when tree creation is not allowed and the seed already has one", async () => {
    const getOrCreateTrustchain = jest.fn<
      ReturnType<GetOrCreateTrustchain>,
      Parameters<GetOrCreateTrustchain>
    >(async (_deviceId, _credentials, callbacks) => {
      callbacks?.onInitialResponse?.({ [TRUSTCHAIN.rootId]: {} });
      return RESULT;
    });
    const { ended, onResult } = startJob(getOrCreateTrustchain, undefined, false);

    expect(await ended()).toEqual([PENDING, COMPLETED]);
    expect(reported(onResult)).toEqual([REPORTED]);
  });

  it.each([undefined, true])(
    "should pass the device callbacks only when allowTreeCreation is %p",
    async allowTreeCreation => {
      const getOrCreateTrustchain = deviceCall(() => Promise.resolve(RESULT));
      const { ended } = startJob(getOrCreateTrustchain, undefined, allowTreeCreation);

      await ended();
      expect(getOrCreateTrustchain.mock.calls[0][2]).not.toHaveProperty("onInitialResponse");
    },
  );

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

  it("should end as failed when the session client cannot be built", async () => {
    const error = new Error("no client");
    const onResult = jest.fn();

    const { ended } = recordJob(
      addMemberIntentJob({
        deviceConnectionResult: CONNECTION,
        deviceExtractedContext: {} as never,
        input: {
          session: sessionOf({ trustchain: null, memberCredentials: MEMBER_CREDENTIALS }),
          client: fakeKeyRingClient({
            forDeviceSession: () => {
              throw error;
            },
          }),
          resultOrder: createLedgerSyncResultOrder(),
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

    expect(reported(witness.onResult)).toEqual([REPORTED]);
    expect(cancelled.states).toEqual([PENDING]);
    expect(reported(cancelled.onResult)).toEqual([REPORTED]);
  });
});
