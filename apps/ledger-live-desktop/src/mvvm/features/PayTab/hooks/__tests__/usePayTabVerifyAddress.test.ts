import { act, renderHook } from "tests/testSetup";
import { usePayTabVerifyAddress } from "../usePayTabVerifyAddress";

describe("usePayTabVerifyAddress", () => {
  it("should start hidden with resolved copy", () => {
    const { result } = renderHook(() => usePayTabVerifyAddress(undefined));

    expect(result.current.phase).toBe("hidden");
    expect(result.current.verifyAddress.phase).toBe("hidden");
    expect(result.current.verifyAddress.labels).toEqual({
      introTitle: "Verify your address",
      introDescription:
        "To protect against address replacement attacks, verify your address on your Ledger device's Secure Screen.",
      verifyCta: "Verify address",
      successTitle: "Address displayed on the device's Secure Screen",
      nextStepsLabel: "Next steps",
      nextStepShare: "Share your address via your desired app",
      nextStepMatch: "Ensure the shared address matches the one on your Ledger Device.",
      gotItCta: "Got it",
    });
  });

  it("should open the intro phase", () => {
    const { result } = renderHook(() => usePayTabVerifyAddress(undefined));

    act(() => result.current.openIntro());

    expect(result.current.phase).toBe("intro");
    expect(result.current.verifyAddress.phase).toBe("intro");
  });

  it("should advance from the intro to the success screen on verify", () => {
    const { result } = renderHook(() => usePayTabVerifyAddress(undefined));

    act(() => result.current.openIntro());
    act(() => result.current.verifyAddress.onVerify());

    expect(result.current.phase).toBe("success");
    expect(result.current.verifyAddress.phase).toBe("success");
  });

  it("should show the success phase when verification completes", () => {
    const { result } = renderHook(() => usePayTabVerifyAddress(undefined));

    act(() => result.current.showSuccess());

    expect(result.current.phase).toBe("success");
    expect(result.current.verifyAddress.phase).toBe("success");
  });

  it("should hide the overlay from the success CTA", () => {
    const { result } = renderHook(() => usePayTabVerifyAddress(undefined));

    act(() => result.current.showSuccess());
    act(() => result.current.verifyAddress.onGotIt());

    expect(result.current.phase).toBe("hidden");
  });

  it("should hide the overlay when closed", () => {
    const { result } = renderHook(() => usePayTabVerifyAddress(undefined));

    act(() => result.current.openIntro());
    act(() => result.current.verifyAddress.onClose());

    expect(result.current.phase).toBe("hidden");
  });
});
