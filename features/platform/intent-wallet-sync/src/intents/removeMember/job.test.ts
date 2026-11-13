import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import {
  NoTrustchainInitialized,
  TrustchainAlreadyInitialized,
  TrustchainAlreadyInitializedWithOtherSeed,
  TrustchainNotAllowed,
} from "@ledgerhq/ledger-key-ring-protocol/errors";
import type {
  MemberCredentials,
  Trustchain,
  TrustchainMember,
  TrustchainSDK,
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
import { removeMemberIntentJob } from "./job";

type RemoveMember = TrustchainSDK["removeMember"];

const MEMBER_CREDENTIALS: MemberCredentials = { pubkey: "pubkey", privatekey: "privatekey" };
const TRUSTCHAIN: Trustchain = {
  rootId: "root-id",
  applicationPath: "m/0'/16'/0'",
  walletSyncEncryptionKey: "key",
};
const ROTATED_TRUSTCHAIN: Trustchain = { ...TRUSTCHAIN, walletSyncEncryptionKey: "rotated" };
const MEMBER: TrustchainMember = { id: "member-2", name: "Other instance", permissions: 0 };

const PENDING: LedgerSyncPendingJobState = { type: "pending" };
const AWAITING: LedgerSyncAwaitingDeviceConfirmationJobState = {
  type: "awaiting-device-confirmation",
  deviceModelId: DeviceModelId.FLEX,
  deviceName: "Ledger Flex",
};
const PROCESSING: LedgerSyncProcessingJobState = { type: "processing" };
const COMPLETED: LedgerSyncCompletedJobState = { type: "completed" };

const CONNECTION = {
  dmk: {} as never,
  sessionId: "session-1",
  connectedDevice: { modelId: DeviceModelId.FLEX } as never,
  compatDeviceId: "compat-1",
  compatDeviceName: "Ledger Flex",
  compatDeviceWired: false,
} satisfies DeviceConnectionResult;

/** A device call that asks for `confirmations` confirmations, then settles with `outcome`. */
function deviceCall(
  outcome: () => Promise<Trustchain>,
  confirmations = 1,
): jest.MockedFunction<RemoveMember> {
  return jest.fn<ReturnType<RemoveMember>, Parameters<RemoveMember>>(
    async (_deviceId, _trustchain, _credentials, _member, callbacks) => {
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

function createJob(removeMember: RemoveMember) {
  const onResult = jest.fn();
  const job$ = removeMemberIntentJob({
    deviceConnectionResult: CONNECTION,
    deviceExtractedContext: {} as never,
    input: {
      trustchain: TRUSTCHAIN,
      memberCredentials: MEMBER_CREDENTIALS,
      member: MEMBER,
      createSessionSdk: () => fakeTrustchainSdk({ removeMember }),
    },
    onResult,
  });
  return { job$, onResult };
}

function startJob(removeMember: RemoveMember) {
  const { job$, onResult } = createJob(removeMember);
  return { ...recordJob(job$), onResult };
}

describe("removeMemberIntentJob", () => {
  it("should remove the member on the session and report the rotated trustchain", async () => {
    const removeMember = deviceCall(() => Promise.resolve(ROTATED_TRUSTCHAIN));
    const { ended, onResult } = startJob(removeMember);

    expect(await ended()).toEqual([PENDING, AWAITING, PROCESSING, COMPLETED]);
    expect(removeMember).toHaveBeenCalledWith(
      "compat-1",
      TRUSTCHAIN,
      MEMBER_CREDENTIALS,
      MEMBER,
      expect.any(Object),
    );
    expect(onResult).toHaveBeenCalledWith(ROTATED_TRUSTCHAIN);
  });

  it("should let the user retry after a refusal", async () => {
    const removeMember = deviceCall(() => Promise.reject(namedError("UserRefusedOnDevice")));
    const { waitFor, ended, onResult } = startJob(removeMember);

    const rejected = await waitFor("device-rejected");
    removeMember.mockImplementation(deviceCall(() => Promise.resolve(ROTATED_TRUSTCHAIN)));
    rejected.retry();

    expect((await ended()).at(-1)).toEqual(COMPLETED);
    expect(removeMember).toHaveBeenCalledTimes(2);
    expect(onResult).toHaveBeenCalledWith(ROTATED_TRUSTCHAIN);
  });

  it("should start one call only when retry is invoked twice or after unsubscribe", async () => {
    const removeMember = deviceCall(() => Promise.reject(namedError("UserRefusedOnDevice")));
    const { states, waitFor, subscription } = startJob(removeMember);
    await waitFor("device-rejected");
    const rejected = expectState(states.at(-1), "device-rejected");

    removeMember.mockImplementation(() => createDeferred<Trustchain>().promise);
    rejected.retry();
    rejected.retry();
    expect(removeMember).toHaveBeenCalledTimes(2);

    subscription.unsubscribe();
    rejected.retry();
    expect(removeMember).toHaveBeenCalledTimes(2);
  });

  it("should stay processing between and after device confirmations", async () => {
    const { ended } = startJob(deviceCall(() => Promise.resolve(ROTATED_TRUSTCHAIN), 2));

    expect(await ended()).toEqual([PENDING, AWAITING, PROCESSING, AWAITING, PROCESSING, COMPLETED]);
  });

  it.each([
    [new TrustchainAlreadyInitialized(), "already-secured-same-seed"],
    [new TrustchainAlreadyInitializedWithOtherSeed(), "already-secured-other-seed"],
    [new TrustchainNotAllowed(), "not-allowed"],
    [new NoTrustchainInitialized(), "no-trustchain"],
    [new Error("network down"), "unknown"],
  ] as const)("should end as failed when the SDK throws %s", async (failure, reason) => {
    const { ended, onResult } = startJob(deviceCall(() => Promise.reject(failure)));

    expect((await ended()).at(-1)).toEqual(failedState(reason, failure));
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

  it("should emit no state but still report the result after unsubscribe", async () => {
    const deviceAnswer = createDeferred<Trustchain>();
    const removeMember = deviceCall(() => deviceAnswer.promise);
    const cancelled = startJob(removeMember);
    // A second run on the same device answer settles after the cancelled one, so awaiting it
    // proves the cancelled run's handlers already ran.
    const witness = createJob(removeMember);
    const witnessEnded = lastValueFrom(witness.job$);

    cancelled.subscription.unsubscribe();
    deviceAnswer.resolve(ROTATED_TRUSTCHAIN);
    await witnessEnded;

    expect(witness.onResult).toHaveBeenCalledWith(ROTATED_TRUSTCHAIN);
    expect(cancelled.states).toEqual([PENDING, AWAITING]);
    expect(cancelled.onResult).toHaveBeenCalledTimes(1);
    expect(cancelled.onResult).toHaveBeenCalledWith(ROTATED_TRUSTCHAIN);
  });
});
