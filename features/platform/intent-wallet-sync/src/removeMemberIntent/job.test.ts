import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import { TrustchainNotAllowed } from "@ledgerhq/ledger-key-ring-protocol/errors";
import type {
  MemberCredentials,
  Trustchain,
  TrustchainDeviceCallbacks,
  TrustchainMember,
  TrustchainSDK,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import type { LedgerSyncJobState } from "../ledgerSyncJobState";
import { removeMemberIntentJob } from "./job";

const MEMBER_CREDENTIALS: MemberCredentials = { pubkey: "pubkey", privatekey: "privatekey" };
const TRUSTCHAIN: Trustchain = {
  rootId: "root-id",
  applicationPath: "m/0'/16'/0'",
  walletSyncEncryptionKey: "key",
};
const ROTATED_TRUSTCHAIN: Trustchain = { ...TRUSTCHAIN, walletSyncEncryptionKey: "rotated" };
const MEMBER: TrustchainMember = { id: "member-2", name: "Other instance", permissions: 0 };

const PENDING = { type: "pending" };
const AWAITING = {
  type: "awaiting-device-confirmation",
  deviceModelId: DeviceModelId.FLEX,
  deviceName: "Ledger Flex",
};

const CONNECTION = {
  dmk: {} as never,
  sessionId: "session-1",
  connectedDevice: { modelId: DeviceModelId.FLEX } as never,
  compatDeviceId: "compat-1",
  compatDeviceName: "Ledger Flex",
  compatDeviceWired: false,
} satisfies DeviceConnectionResult;

type RemoveMember = TrustchainSDK["removeMember"];

function flush() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

function namedError(name: string): Error {
  const error = new Error(name);
  error.name = name;
  return error;
}

function deviceCall(outcome: () => Promise<Trustchain>): jest.MockedFunction<RemoveMember> {
  return jest.fn(
    async (
      _deviceId: string,
      _trustchain: Trustchain,
      _credentials: MemberCredentials,
      _member: TrustchainMember,
      callbacks?: TrustchainDeviceCallbacks,
    ) => {
      callbacks?.onStartRequestUserInteraction?.();
      try {
        return await outcome();
      } finally {
        callbacks?.onEndRequestUserInteraction?.();
      }
    },
  );
}

function startJob(removeMember: RemoveMember) {
  const sdk = { removeMember } as unknown as TrustchainSDK;
  const onResult = jest.fn();
  const states: LedgerSyncJobState[] = [];
  const complete = jest.fn();
  const error = jest.fn();

  const subscription = removeMemberIntentJob({
    deviceConnectionResult: CONNECTION,
    deviceExtractedContext: {} as never,
    input: {
      trustchain: TRUSTCHAIN,
      memberCredentials: MEMBER_CREDENTIALS,
      member: MEMBER,
      createSessionSdk: () => sdk,
    },
    onResult,
  }).subscribe({ next: state => states.push(state), complete, error });

  return { states, onResult, complete, error, subscription };
}

describe("removeMemberIntentJob", () => {
  it("should remove the member on the session and report the rotated trustchain", async () => {
    const removeMember = deviceCall(() => Promise.resolve(ROTATED_TRUSTCHAIN));
    const { states, onResult, complete, error } = startJob(removeMember);

    await flush();

    expect(removeMember).toHaveBeenCalledWith(
      "compat-1",
      TRUSTCHAIN,
      MEMBER_CREDENTIALS,
      MEMBER,
      expect.any(Object),
    );
    expect(states).toEqual([PENDING, AWAITING, PENDING, { type: "completed" }]);
    expect(onResult).toHaveBeenCalledWith(ROTATED_TRUSTCHAIN);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();
  });

  it("should let the user retry after a refusal", async () => {
    const removeMember = deviceCall(() => Promise.reject(namedError("UserRefusedOnDevice")));
    const { states, onResult, complete } = startJob(removeMember);

    await flush();
    const rejected = states.at(-1) as Extract<LedgerSyncJobState, { type: "device-rejected" }>;
    expect(rejected.type).toBe("device-rejected");

    removeMember.mockImplementation(deviceCall(() => Promise.resolve(ROTATED_TRUSTCHAIN)));
    rejected.retry();
    await flush();

    expect(removeMember).toHaveBeenCalledTimes(2);
    expect(states.at(-1)).toEqual({ type: "completed" });
    expect(onResult).toHaveBeenCalledWith(ROTATED_TRUSTCHAIN);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("should end as failed with its reason when the SDK throws", async () => {
    const failure = new TrustchainNotAllowed();
    const { states, complete, error } = startJob(deviceCall(() => Promise.reject(failure)));

    await flush();

    expect(states.at(-1)).toEqual({ type: "failed", reason: "not-allowed", error: failure });
    expect(complete).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();
  });

  it("should emit nothing after unsubscribe", async () => {
    const { states, onResult, complete, subscription } = startJob(
      deviceCall(() => Promise.resolve(ROTATED_TRUSTCHAIN)),
    );

    subscription.unsubscribe();
    await flush();

    expect(states).toEqual([PENDING, AWAITING]);
    expect(onResult).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
  });
});
