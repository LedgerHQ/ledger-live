import { act, renderHook } from "@testing-library/react";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import type { VerifyAddressIntentResult } from "@features/platform-intent-verify-address";
import { track } from "@shared/analytics";
import { useVerifyAddressSession } from "./useVerifyAddressSession";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

const mockTrack = jest.mocked(track);

const ETH = CryptoOrTokenCurrencyIdSchema.parse("ethereum");
const TRACKING = { asset: "ETH", network: "ethereum" };
const EVENT_PROPERTIES = {
  page: "Receive Address Verification",
  flow: "receive",
  asset: "ETH",
  network: "ethereum",
};

const ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

const RESULTS = {
  verified: { type: "verified", address: ADDRESS },
  refused: { type: "refused" },
  mismatch: { type: "mismatch", expectedAddress: ADDRESS, reportedAddress: "0xDEAD" },
  unsupported: { type: "unsupported", error: new Error("cannot display") },
} satisfies Record<string, VerifyAddressIntentResult>;

const WRONG_DEVICE = { failureType: "WrongDeviceForAccount", countsAsFailure: true };
const BLOCKING_FAILURE = { failureType: "DeviceNotOnboarded", countsAsFailure: true };
const JOB_ERROR = new Error("device unplugged");
const RETRYABLE_FAILURE = { failureType: "DeviceLocked", countsAsFailure: false };

function renderSession() {
  const onExit = jest.fn();
  const { result } = renderHook(() =>
    useVerifyAddressSession({ assetId: ETH, tracking: TRACKING, onExit }),
  );
  return { onExit, result };
}

describe("useVerifyAddressSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should send the unsupported event when the job reports the device cannot show the address", () => {
    const { onExit, result } = renderSession();

    act(() => result.current.onResult(RESULTS.unsupported));

    expect(mockTrack).toHaveBeenCalledWith("receive_verification_unsupported", EVENT_PROPERTIES);
    expect(onExit).not.toHaveBeenCalled();
  });

  it.each([RESULTS.verified, RESULTS.refused, RESULTS.mismatch])(
    "should not track the device's $type answer, which comes after the user could go back",
    jobResult => {
      const { result } = renderSession();

      act(() => result.current.onResult(jobResult));

      expect(mockTrack).not.toHaveBeenCalled();
    },
  );

  it.each([
    { result: RESULTS.verified, outcome: "verified" },
    { result: RESULTS.refused, outcome: "cancelled" },
    { result: RESULTS.mismatch, outcome: "mismatch" },
    { result: RESULTS.unsupported, outcome: "unsupported" },
  ])(
    "should exit as $outcome without the dismiss event when the user leaves after $result.type",
    ({ result: jobResult, outcome }) => {
      const { onExit, result } = renderSession();
      act(() => result.current.onResult(jobResult));

      act(() => result.current.onUserCancel(null));

      expect(onExit).toHaveBeenCalledWith(outcome);
      expect(mockTrack).not.toHaveBeenCalledWith("receive_verification_dismiss", expect.anything());
    },
  );

  it("should end with the last result when the user retries after a refusal", () => {
    const { onExit, result } = renderSession();
    act(() => result.current.onResult(RESULTS.refused));
    act(() => result.current.onAttemptStart());
    act(() => result.current.onResult(RESULTS.verified));

    act(() => result.current.onUserCancel(null));

    expect(onExit).toHaveBeenCalledWith("verified");
  });

  it("should exit as dismissed with the dismiss event when the user leaves a retry after a refusal", () => {
    const { onExit, result } = renderSession();
    act(() => result.current.onResult(RESULTS.refused));
    act(() => result.current.onAttemptStart());

    act(() => result.current.onUserCancel(null));

    expect(onExit).toHaveBeenCalledWith("dismissed");
    expect(mockTrack).toHaveBeenCalledWith("receive_verification_dismiss", EVENT_PROPERTIES);
  });

  it("should exit as dismissed when the user leaves a retry after a job error", () => {
    const { onExit, result } = renderSession();
    act(() => result.current.onJobError(JOB_ERROR));
    act(() => result.current.onAttemptStart());

    act(() => result.current.onUserCancel(null));

    expect(onExit).toHaveBeenCalledWith("dismissed");
  });

  it("should exit as cancelled after a refusal on each attempt", () => {
    const { onExit, result } = renderSession();
    act(() => result.current.onResult(RESULTS.refused));
    act(() => result.current.onAttemptStart());
    act(() => result.current.onResult(RESULTS.refused));

    act(() => result.current.onUserCancel(null));

    expect(onExit).toHaveBeenCalledWith("cancelled");
  });

  it.each([
    { result: RESULTS.refused, outcome: "cancelled" },
    { result: RESULTS.verified, outcome: "verified" },
  ])(
    "should exit as $outcome when the retry after a job error reports $result.type",
    ({ result: jobResult, outcome }) => {
      const { onExit, result } = renderSession();
      act(() => result.current.onJobError(JOB_ERROR));
      act(() => result.current.onAttemptStart());
      act(() => result.current.onResult(jobResult));

      act(() => result.current.onUserCancel(null));

      expect(onExit).toHaveBeenCalledWith(outcome);
    },
  );

  it("should keep a verified result when a new attempt starts", () => {
    const { onExit, result } = renderSession();
    act(() => result.current.onResult(RESULTS.verified));
    act(() => result.current.onAttemptStart());

    act(() => result.current.onUserCancel(null));

    expect(onExit).toHaveBeenCalledWith("verified");
  });

  it.each([
    { first: RESULTS.mismatch, next: RESULTS.verified, outcome: "mismatch" },
    { first: RESULTS.verified, next: RESULTS.refused, outcome: "verified" },
    { first: RESULTS.unsupported, next: RESULTS.verified, outcome: "unsupported" },
  ])(
    "should keep the $outcome result when a retry after a reconnection reports another one",
    ({ first, next, outcome }) => {
      const { onExit, result } = renderSession();
      act(() => result.current.onResult(first));
      act(() => result.current.onAttemptStart());
      mockTrack.mockClear();

      act(() => result.current.onResult(next));
      act(() => result.current.onUserCancel(null));

      expect(mockTrack).not.toHaveBeenCalled();
      expect(onExit).toHaveBeenCalledWith(outcome);
    },
  );

  it("should exit as dismissed and send the dismiss event when the user leaves before any result", () => {
    const { onExit, result } = renderSession();

    act(() => result.current.onUserCancel(null));

    expect(mockTrack).toHaveBeenCalledWith("receive_verification_dismiss", EVENT_PROPERTIES);
    expect(onExit).toHaveBeenCalledWith("dismissed");
  });

  it("should exit as dismissed when the user leaves an error screen they can fix", () => {
    const { onExit, result } = renderSession();

    act(() => result.current.onUserCancel(RETRYABLE_FAILURE));

    expect(onExit).toHaveBeenCalledWith("dismissed");
  });

  it.each([
    { failure: WRONG_DEVICE, case: "the user closes the wrong device screen" },
    { failure: BLOCKING_FAILURE, case: "the device flow ended on an error" },
    {
      failure: { failureType: "DeviceDisconnected", countsAsFailure: true },
      case: "the device disconnected",
    },
  ])("should exit as failed without any event when $case", ({ failure }) => {
    const { onExit, result } = renderSession();

    act(() => result.current.onUserCancel(failure));

    expect(onExit).toHaveBeenCalledWith("failed");
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it("should exit as failed without any event when the job errored", () => {
    const { onExit, result } = renderSession();
    act(() => result.current.onJobError(JOB_ERROR));

    act(() => result.current.onUserCancel(null));

    expect(onExit).toHaveBeenCalledWith("failed");
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it("should exit as failed when the job errors after a refusal and a retry", () => {
    const { onExit, result } = renderSession();
    act(() => result.current.onResult(RESULTS.refused));
    act(() => result.current.onAttemptStart());
    act(() => result.current.onJobError(JOB_ERROR));

    act(() => result.current.onUserCancel(null));

    expect(onExit).toHaveBeenCalledWith("failed");
  });

  describe("once the device shows the address", () => {
    it("should go back to the address on Got it, with no dismiss event", () => {
      const { onExit, result } = renderSession();
      act(() => result.current.onAddressDisplayed());

      act(() => result.current.onUserCancel(null));

      expect(onExit).toHaveBeenCalledWith("displayed");
      expect(mockTrack).not.toHaveBeenCalled();
    });

    it("should go back to the address when the device approved", () => {
      const { onExit, result } = renderSession();
      act(() => result.current.onAddressDisplayed());
      act(() => result.current.onResult(RESULTS.verified));

      act(() => result.current.onUserCancel(null));

      expect(onExit).toHaveBeenCalledWith("displayed");
      expect(mockTrack).not.toHaveBeenCalled();
    });

    it("should end as unsupported when the device cannot show the address after the request", () => {
      const { onExit, result } = renderSession();
      act(() => result.current.onAddressDisplayed());
      act(() => result.current.onResult(RESULTS.unsupported));

      act(() => result.current.onUserCancel(null));

      expect(onExit).toHaveBeenCalledWith("unsupported");
    });

    it("should end as mismatch when the user closes the mismatch screen", () => {
      const { onExit, result } = renderSession();
      act(() => result.current.onAddressDisplayed());
      act(() => result.current.onResult(RESULTS.mismatch));

      act(() => result.current.onUserCancel(null));

      expect(onExit).toHaveBeenCalledWith("mismatch");
    });

    it("should report a failure when an error ended the request before any answer", () => {
      const { onExit, result } = renderSession();
      act(() => result.current.onAddressDisplayed());

      act(() => result.current.onUserCancel(BLOCKING_FAILURE));

      expect(onExit).toHaveBeenCalledWith("failed");
    });

    it("should forget the shown address when a new attempt starts", () => {
      const { onExit, result } = renderSession();
      act(() => result.current.onAddressDisplayed());
      act(() => result.current.onAttemptStart());

      act(() => result.current.onUserCancel(null));

      expect(onExit).toHaveBeenCalledWith("dismissed");
    });
  });

  it("should keep the verified result when the device disconnects afterwards", () => {
    const { onExit, result } = renderSession();
    act(() => result.current.onResult(RESULTS.verified));

    act(() => result.current.onUserCancel(BLOCKING_FAILURE));

    expect(onExit).toHaveBeenCalledWith("verified");
  });

  it("should send the unsupported event with the given tracking when the device cannot show the address", () => {
    const onExit = jest.fn();
    const { result } = renderHook(() =>
      useVerifyAddressSession({ assetId: ETH, tracking: undefined, onExit }),
    );

    act(() => result.current.exitEarly("unsupported", TRACKING));

    expect(mockTrack).toHaveBeenCalledWith("receive_verification_unsupported", EVENT_PROPERTIES);
    expect(onExit).toHaveBeenCalledWith("unsupported");
  });

  it("should exit as failed without any event when the verification cannot start", () => {
    const { onExit, result } = renderSession();

    act(() => result.current.exitEarly("failed"));

    expect(onExit).toHaveBeenCalledWith("failed");
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it("should exit only once", () => {
    const { onExit, result } = renderSession();

    act(() => result.current.exitEarly("failed"));
    act(() => result.current.onUserCancel(null));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledWith("failed");
    expect(mockTrack).not.toHaveBeenCalled();
  });
});
