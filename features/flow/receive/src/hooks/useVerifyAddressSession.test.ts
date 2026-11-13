import { act, renderHook } from "@testing-library/react";
import type { VerifyAddressIntentJobState } from "@features/platform-intent-verify-address";
import { track } from "@shared/analytics";
import { useVerifyAddressSession } from "./useVerifyAddressSession";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

const mockTrack = jest.mocked(track);

type VerifyingState = Extract<VerifyAddressIntentJobState, { type: "verifying" }>;

const TRACKING = { asset: "ETH", network: "ethereum" };
const EVENT_PROPERTIES = {
  page: "Receive Address Verification",
  flow: "receive",
  asset: "ETH",
  network: "ethereum",
};

const ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

const JOB_STATES = {
  verifying: {
    type: "verifying",
    deviceModelId: "stax" as VerifyingState["deviceModelId"],
    deviceName: "Ledger Stax",
  },
  addressDisplayed: { type: "addressDisplayed" },
  verified: { type: "verified", address: ADDRESS },
  cancelled: { type: "cancelled", retry: () => {} },
  mismatch: { type: "mismatch", expectedAddress: ADDRESS, reportedAddress: "0xDEAD" },
  unsupported: { type: "unsupported", error: new Error("cannot display") },
} satisfies Record<string, VerifyAddressIntentJobState>;

function renderSession() {
  const onExit = jest.fn();
  const { result } = renderHook(() => useVerifyAddressSession({ tracking: TRACKING, onExit }));
  return { onExit, result };
}

describe("useVerifyAddressSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    { state: JOB_STATES.verified, event: "receive_verification_complete" },
    { state: JOB_STATES.cancelled, event: "receive_verification_cancelled" },
    { state: JOB_STATES.mismatch, event: "receive_verification_mismatch" },
    { state: JOB_STATES.unsupported, event: "receive_verification_unsupported" },
  ])("should send $event when the job reaches $state.type", ({ state, event }) => {
    const { onExit, result } = renderSession();

    act(() => result.current.onJobStateChanged(state));

    expect(mockTrack).toHaveBeenCalledWith(event, EVENT_PROPERTIES);
    expect(onExit).not.toHaveBeenCalled();
  });

  it.each([JOB_STATES.verifying, JOB_STATES.addressDisplayed])(
    "should send nothing while the job is $type",
    state => {
      const { result } = renderSession();

      act(() => result.current.onJobStateChanged(state));

      expect(mockTrack).not.toHaveBeenCalled();
    },
  );

  it("should exit as verified when the user leaves after confirming on the device", () => {
    const { onExit, result } = renderSession();
    act(() => result.current.onJobStateChanged(JOB_STATES.verified));

    act(() => result.current.onUserCancel());

    expect(onExit).toHaveBeenCalledWith("verified");
    expect(mockTrack).not.toHaveBeenCalledWith("receive_verification_dismiss", expect.anything());
  });

  it.each([JOB_STATES.cancelled, JOB_STATES.mismatch, JOB_STATES.unsupported])(
    "should exit as $type when the user leaves its screen",
    state => {
      const { onExit, result } = renderSession();
      act(() => result.current.onJobStateChanged(state));

      act(() => result.current.onUserCancel());

      expect(onExit).toHaveBeenCalledWith(state.type);
    },
  );

  it("should exit as dismissed and send the dismiss event when the user leaves before confirming", () => {
    const { onExit, result } = renderSession();
    act(() => result.current.onJobStateChanged(JOB_STATES.addressDisplayed));

    act(() => result.current.onUserCancel());

    expect(mockTrack).toHaveBeenCalledWith("receive_verification_dismiss", EVENT_PROPERTIES);
    expect(onExit).toHaveBeenCalledWith("dismissed");
  });

  it("should forget a refusal once the user retries", () => {
    const { onExit, result } = renderSession();
    act(() => result.current.onJobStateChanged(JOB_STATES.cancelled));
    act(() => result.current.onJobStateChanged(JOB_STATES.verifying));

    act(() => result.current.onUserCancel());

    expect(onExit).toHaveBeenCalledWith("dismissed");
  });

  it("should exit only once", () => {
    const { onExit, result } = renderSession();

    act(() => result.current.exit("initFailed"));
    act(() => result.current.onUserCancel());

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledWith("initFailed");
    expect(mockTrack).not.toHaveBeenCalled();
  });
});
