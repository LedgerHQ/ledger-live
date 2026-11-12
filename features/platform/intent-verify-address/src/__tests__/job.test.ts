import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { Subject } from "rxjs";
import { verifyAddressIntentJob } from "../job";
import type {
  VerifyAddressDeviceAction,
  VerifyAddressDeviceState,
  VerifyAddressIntentJobState,
} from "../types";

const EXPECTED_ADDRESS = "0xAbC0000000000000000000000000000000000001";
const BASE58_ADDRESS = "So11111111111111111111111111111111111111112";
const VERIFYING: VerifyAddressIntentJobState = {
  type: "verifying",
  deviceModelId: DeviceModelId.STAX,
  deviceName: "Ledger Stax",
};
const ADDRESS_DISPLAYED: VerifyAddressIntentJobState = { type: "addressDisplayed" };

function startJob(expectedAddress = EXPECTED_ADDRESS) {
  const subject = new Subject<VerifyAddressDeviceState>();
  const cancel = jest.fn();
  const startAddressVerification = jest.fn((): VerifyAddressDeviceAction => ({
    observable: subject.asObservable(),
    cancel,
  }));
  const states: VerifyAddressIntentJobState[] = [];
  let error: unknown;
  let completed = false;

  const subscription = verifyAddressIntentJob({
    deviceConnectionResult: {
      dmk: {} as never,
      sessionId: "session-1",
      connectedDevice: { modelId: DeviceModelId.STAX } as never,
      compatDeviceId: "compat-1",
      compatDeviceName: "Ledger Stax",
      compatDeviceWired: true,
    },
    deviceExtractedContext: {} as never,
    input: { expectedAddress, startAddressVerification },
    onResult: jest.fn(),
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
    cancel,
    startAddressVerification,
    subscription,
    emit: (state: VerifyAddressDeviceState) => subject.next(state),
    fail: (err: Error) => subject.error(err),
    isCompleted: () => completed,
    getError: () => error,
  };
}

describe("verifyAddressIntentJob", () => {
  it.each([
    ["hex, case-insensitive", EXPECTED_ADDRESS, EXPECTED_ADDRESS.toLowerCase()],
    ["non-hex, exact", BASE58_ADDRESS, BASE58_ADDRESS],
  ] as const)("emits verified when addresses match (%s)", (_label, expected, reported) => {
    const { states, emit, isCompleted } = startJob(expected);
    emit({ type: "confirmed", address: reported });
    expect(states).toEqual([VERIFYING, { type: "verified", address: reported }]);
    expect(isCompleted()).toBe(true);
  });

  it.each([
    ["hex mismatch", EXPECTED_ADDRESS, "0xDEAD000000000000000000000000000000000000"],
    ["non-hex casing", BASE58_ADDRESS, BASE58_ADDRESS.toLowerCase()],
  ] as const)("emits mismatch when addresses differ (%s)", (_label, expected, reported) => {
    const { states, emit, isCompleted } = startJob(expected);
    emit({ type: "confirmed", address: reported });
    expect(states).toEqual([
      VERIFYING,
      { type: "mismatch", expectedAddress: expected, reportedAddress: reported },
    ]);
    expect(isCompleted()).toBe(true);
  });

  it("emits addressDisplayed when the device shows the address, before the user confirms", () => {
    const { states, emit, isCompleted } = startJob();
    emit({ type: "awaiting-confirmation" });
    expect(states).toEqual([VERIFYING, ADDRESS_DISPLAYED]);
    expect(isCompleted()).toBe(false);

    emit({ type: "confirmed", address: EXPECTED_ADDRESS });
    expect(states).toEqual([
      VERIFYING,
      ADDRESS_DISPLAYED,
      { type: "verified", address: EXPECTED_ADDRESS },
    ]);
    expect(isCompleted()).toBe(true);
  });

  it("emits addressDisplayed once per attempt when the device reports it several times", () => {
    const { states, emit } = startJob();
    emit({ type: "awaiting-confirmation" });
    emit({ type: "awaiting-confirmation" });
    expect(states).toEqual([VERIFYING, ADDRESS_DISPLAYED]);
  });

  it("completes with mismatch after the address was displayed", () => {
    const reportedAddress = "0xDEAD000000000000000000000000000000000000";
    const { states, emit, isCompleted } = startJob();
    emit({ type: "awaiting-confirmation" });
    emit({ type: "confirmed", address: reportedAddress });
    expect(states).toEqual([
      VERIFYING,
      ADDRESS_DISPLAYED,
      { type: "mismatch", expectedAddress: EXPECTED_ADDRESS, reportedAddress },
    ]);
    expect(isCompleted()).toBe(true);
  });

  it("emits cancelled with a working retry when refused", () => {
    const { states, emit, startAddressVerification } = startJob();
    emit({ type: "refused" });

    const cancelled = states[1] as Extract<VerifyAddressIntentJobState, { type: "cancelled" }>;
    expect(cancelled.type).toBe("cancelled");
    expect(startAddressVerification).toHaveBeenCalledTimes(1);

    cancelled.retry();
    expect(startAddressVerification).toHaveBeenCalledTimes(2);
    expect(states[2]).toEqual(VERIFYING);
  });

  it("restarts with verifying then addressDisplayed when retried after a refusal", () => {
    const { states, emit } = startJob();
    emit({ type: "awaiting-confirmation" });
    emit({ type: "refused" });

    const cancelled = states[2] as Extract<VerifyAddressIntentJobState, { type: "cancelled" }>;
    cancelled.retry();
    emit({ type: "awaiting-confirmation" });

    expect(states.map(state => state.type)).toEqual([
      "verifying",
      "addressDisplayed",
      "cancelled",
      "verifying",
      "addressDisplayed",
    ]);
  });

  it("emits unsupported with the adapter error and completes", () => {
    const error = new Error("cannot display");
    const { states, emit, isCompleted } = startJob();
    emit({ type: "unsupported", error });
    expect(states).toEqual([VERIFYING, { type: "unsupported", error }]);
    expect(isCompleted()).toBe(true);
  });

  it("defaults the unsupported error when omitted", () => {
    const { states, emit } = startJob();
    emit({ type: "unsupported" });
    expect(states[1]).toMatchObject({ type: "unsupported" });
    expect((states[1] as { error: unknown }).error).toBeInstanceOf(Error);
  });

  it("propagates unexpected device errors", () => {
    const { fail, getError, isCompleted } = startJob();
    fail(new Error("device disconnected"));
    expect(getError()).toBeInstanceOf(Error);
    expect(isCompleted()).toBe(false);
  });

  it("cancels the device action on unsubscribe", () => {
    const { cancel, subscription } = startJob();
    subscription.unsubscribe();
    expect(cancel).toHaveBeenCalled();
  });
});
