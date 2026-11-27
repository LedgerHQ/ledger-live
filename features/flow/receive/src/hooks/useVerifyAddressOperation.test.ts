import { act, renderHook, waitFor } from "@testing-library/react";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import type { VerifyAddressIntentResult } from "@features/platform-intent-verify-address";
import { setOperationSink } from "@shared/observability-operations";
import { ADDRESS, SELECTION, fakePorts } from "../__tests__/verifyAddressPorts";
import { useVerifyAddressExecutorViewModel } from "./useVerifyAddressExecutorViewModel";
import { useVerifyAddressSession } from "./useVerifyAddressSession";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

const ETH = CryptoOrTokenCurrencyIdSchema.parse("ethereum");
const TRACKING = { asset: "ETH", network: "ethereum" };

const RESULTS = {
  verified: { type: "verified", address: ADDRESS },
  refused: { type: "refused" },
  mismatch: { type: "mismatch", expectedAddress: ADDRESS, reportedAddress: "0xDEAD" },
  unsupported: { type: "unsupported", error: new Error("cannot display") },
} satisfies Record<string, VerifyAddressIntentResult>;

const RETRYABLE_FAILURE = { failureType: "DeviceLocked", countsAsFailure: false };
const BLOCKING_FAILURE = { failureType: "DeviceNotOnboarded", countsAsFailure: true };
const DISCONNECTED = Object.assign(new Error("device unplugged"), { name: "DisconnectedDevice" });

const sink = { isRecording: () => true, start: jest.fn(), succeed: jest.fn(), fail: jest.fn() };

function renderSession({ isPrepared = true } = {}) {
  const onExit = jest.fn();
  const tracking = isPrepared ? TRACKING : undefined;
  const rendered = renderHook(() => useVerifyAddressSession({ assetId: ETH, tracking, onExit }));
  return { ...rendered, onExit };
}

describe("receive_verify_address operation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setOperationSink(sink);
  });

  afterEach(() => {
    setOperationSink(null);
  });

  it("should start when the verification mounts, with the asset", () => {
    renderSession();

    expect(sink.start).toHaveBeenCalledTimes(1);
    expect(sink.start).toHaveBeenCalledWith("receive_verify_address", undefined, {
      currency_id: "ethereum",
    });
  });

  it("should succeed with the network when the device showed the address", () => {
    const { result } = renderSession();
    act(() => result.current.onAddressDisplayed());

    act(() => result.current.onUserCancel(null));

    expect(sink.succeed).toHaveBeenCalledWith("receive_verify_address", undefined, {
      currency_id: "ethereum",
      network_id: "ethereum",
    });
    expect(sink.fail).not.toHaveBeenCalled();
  });

  it("should succeed when the device approved the address", () => {
    const { result } = renderSession();
    act(() => result.current.onResult(RESULTS.verified));

    act(() => result.current.onUserCancel(null));

    expect(sink.succeed).toHaveBeenCalledWith("receive_verify_address", undefined, {
      currency_id: "ethereum",
      network_id: "ethereum",
    });
  });

  it("should succeed as unsupported when the device cannot show the address", () => {
    const { result } = renderSession();
    act(() => result.current.onResult(RESULTS.unsupported));

    act(() => result.current.onUserCancel(null));

    expect(sink.succeed).toHaveBeenCalledWith(
      "receive_verify_address",
      undefined,
      expect.objectContaining({ outcome: "unsupported" }),
    );
  });

  it("should succeed as unsupported, with the network, when the verification ends before the device", () => {
    const { result } = renderSession({ isPrepared: false });

    act(() => result.current.exitEarly("unsupported", TRACKING));

    expect(sink.succeed).toHaveBeenCalledWith("receive_verify_address", undefined, {
      currency_id: "ethereum",
      network_id: "ethereum",
      outcome: "unsupported",
    });
  });

  it("should fail as an error named after the mismatch when the device returned another address", () => {
    const { result } = renderSession();
    act(() => result.current.onResult(RESULTS.mismatch));

    act(() => result.current.onUserCancel(null));

    expect(sink.fail).toHaveBeenCalledWith(
      "receive_verify_address",
      undefined,
      "ERROR",
      expect.objectContaining({ outcome: "mismatch", error_name: "AddressMismatch" }),
    );
  });

  it("should send only the mismatch when a job error follows it in the same attempt", () => {
    const { result } = renderSession();
    act(() => result.current.onResult(RESULTS.mismatch));
    act(() => result.current.onJobError(DISCONNECTED));

    act(() => result.current.onUserCancel(null));

    expect(sink.fail).toHaveBeenCalledWith("receive_verify_address", undefined, "ERROR", {
      currency_id: "ethereum",
      network_id: "ethereum",
      outcome: "mismatch",
      error_name: "AddressMismatch",
    });
  });

  it("should fail as an error with the last job error when the job errored", () => {
    const { result } = renderSession();
    act(() => result.current.onJobError(DISCONNECTED));

    act(() => result.current.onUserCancel(null));

    expect(sink.fail).toHaveBeenCalledWith(
      "receive_verify_address",
      undefined,
      "ERROR",
      expect.objectContaining({
        error_name: "DisconnectedDevice",
        error_message: "device unplugged",
      }),
    );
  });

  it("should send no job error with the success of a retry after it", () => {
    const { result } = renderSession();
    act(() => result.current.onAttemptStart());
    act(() => result.current.onJobError(DISCONNECTED));
    act(() => result.current.onAttemptStart());
    act(() => result.current.onAddressDisplayed());

    act(() => result.current.onUserCancel(null));

    expect(sink.succeed).toHaveBeenCalledWith("receive_verify_address", undefined, {
      currency_id: "ethereum",
      network_id: "ethereum",
      retry_count: 1,
    });
  });

  it("should forget the job error of a previous attempt when the next one is dismissed", () => {
    const { result } = renderSession();
    act(() => result.current.onJobError(DISCONNECTED));
    act(() => result.current.onAttemptStart());

    act(() => result.current.onUserCancel(null));

    expect(sink.fail.mock.lastCall?.[3]).not.toHaveProperty("error_name");
  });

  it("should send no error screen with a success the user closed it after", () => {
    const { result } = renderSession();
    act(() => result.current.onResult(RESULTS.verified));

    act(() => result.current.onUserCancel(BLOCKING_FAILURE));

    expect(sink.succeed).toHaveBeenCalledWith("receive_verify_address", undefined, {
      currency_id: "ethereum",
      network_id: "ethereum",
    });
  });

  it("should fail as an error with the error screen the user closed", () => {
    const { result } = renderSession();

    act(() => result.current.onUserCancel(BLOCKING_FAILURE));

    expect(sink.fail).toHaveBeenCalledWith(
      "receive_verify_address",
      undefined,
      "ERROR",
      expect.objectContaining({ failure_type: "DeviceNotOnboarded" }),
    );
  });

  it("should fail as an error at the prepare step when the verification cannot start", () => {
    const { result } = renderSession({ isPrepared: false });

    act(() => result.current.exitEarly("failed"));

    expect(sink.fail).toHaveBeenCalledWith("receive_verify_address", undefined, "ERROR", {
      currency_id: "ethereum",
      step: "prepare",
    });
  });

  it("should be abandoned as refused when the user refused on the device", () => {
    const { result } = renderSession();
    act(() => result.current.onResult(RESULTS.refused));

    act(() => result.current.onUserCancel(null));

    expect(sink.fail).toHaveBeenCalledWith(
      "receive_verify_address",
      undefined,
      "ABANDONED",
      expect.objectContaining({ outcome: "refused" }),
    );
  });

  it("should be abandoned when the user leaves before the device shows the address", () => {
    const { result } = renderSession();

    act(() => result.current.onUserCancel(null));

    expect(sink.fail).toHaveBeenCalledWith("receive_verify_address", undefined, "ABANDONED", {
      currency_id: "ethereum",
      network_id: "ethereum",
    });
  });

  it("should be abandoned with the error screen when the user leaves on an error they can fix", () => {
    const { result } = renderSession();

    act(() => result.current.onUserCancel(RETRYABLE_FAILURE));

    expect(sink.fail).toHaveBeenCalledWith("receive_verify_address", undefined, "ABANDONED", {
      currency_id: "ethereum",
      network_id: "ethereum",
      failure_type: "DeviceLocked",
    });
  });

  it("should count the retries of the device request", () => {
    const { result } = renderSession();
    act(() => result.current.onAttemptStart());
    act(() => result.current.onAttemptStart());
    act(() => result.current.onAttemptStart());

    act(() => result.current.onUserCancel(null));

    expect(sink.fail).toHaveBeenCalledWith(
      "receive_verify_address",
      undefined,
      "ABANDONED",
      expect.objectContaining({ retry_count: 2 }),
    );
  });

  it("should send no retry count when the first device request is the only one", () => {
    const { result } = renderSession();
    act(() => result.current.onAttemptStart());

    act(() => result.current.onUserCancel(null));

    expect(sink.fail.mock.lastCall?.[3]).not.toHaveProperty("retry_count");
  });

  it("should be abandoned on unmount when the verification never ended", () => {
    const { unmount } = renderSession();

    unmount();

    expect(sink.fail).toHaveBeenCalledWith(
      "receive_verify_address",
      undefined,
      "ABANDONED",
      expect.objectContaining({ trigger: "unmount" }),
    );
  });

  it("should end only once, at the first exit", () => {
    const { result, unmount } = renderSession();
    act(() => result.current.onAddressDisplayed());

    act(() => result.current.onUserCancel(null));
    act(() => result.current.exitEarly("failed"));
    unmount();

    expect(sink.succeed).toHaveBeenCalledTimes(1);
    expect(sink.fail).not.toHaveBeenCalled();
  });

  describe("through the executor view model", () => {
    it("should start before the preparation fails, then fail at the prepare step", async () => {
      const onExit = jest.fn();
      renderHook(() =>
        useVerifyAddressExecutorViewModel(
          { selection: SELECTION, onExit },
          fakePorts({ getAccount: jest.fn(() => undefined) }),
        ),
      );

      await waitFor(() => expect(onExit).toHaveBeenCalledWith("failed"));
      expect(sink.start).toHaveBeenCalledTimes(1);
      expect(sink.fail).toHaveBeenCalledWith("receive_verify_address", undefined, "ERROR", {
        currency_id: "ethereum",
        step: "prepare",
      });
      expect(sink.start.mock.invocationCallOrder[0]).toBeLessThan(
        sink.fail.mock.invocationCallOrder[0],
      );
    });

    it("should fail at the prepare step with the error that stopped the preparation", async () => {
      const onExit = jest.fn();
      const preparationError = Object.assign(new Error("init input unavailable"), {
        name: "NetworkError",
      });
      renderHook(() =>
        useVerifyAddressExecutorViewModel(
          { selection: SELECTION, onExit },
          fakePorts({ buildInitializationInput: jest.fn(() => Promise.reject(preparationError)) }),
        ),
      );

      await waitFor(() => expect(onExit).toHaveBeenCalledWith("failed"));
      expect(sink.fail).toHaveBeenCalledWith(
        "receive_verify_address",
        undefined,
        "ERROR",
        expect.objectContaining({
          step: "prepare",
          error_name: "NetworkError",
          error_message: "init input unavailable",
        }),
      );
    });

    it("should fail with the executor's job error and the prepared network", async () => {
      const { result } = renderHook(() =>
        useVerifyAddressExecutorViewModel({ selection: SELECTION, onExit: jest.fn() }, fakePorts()),
      );
      await waitFor(() => expect(result.current).not.toBeNull());

      act(() => result.current?.onIntentJobError(DISCONNECTED));
      act(() => result.current?.onUserCancel(null));

      expect(sink.fail).toHaveBeenCalledWith(
        "receive_verify_address",
        undefined,
        "ERROR",
        expect.objectContaining({ network_id: "ethereum", error_name: "DisconnectedDevice" }),
      );
    });
  });
});
