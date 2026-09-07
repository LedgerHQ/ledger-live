import { act, renderHook } from "@tests/test-renderer";
import { usePayTabVerifyAddress } from "../usePayTabVerifyAddress";

describe("usePayTabVerifyAddress", () => {
  it("should start hidden with resolved copy", () => {
    const { result } = renderHook(() => usePayTabVerifyAddress());

    expect(result.current.verifyAddress.phase).toBe("hidden");
    expect(result.current.verifyAddress.labels.introTitle).toBe("Verify your address");
    expect(result.current.verifyAddress.labels.verifyCta).toBe("Verify address");
    expect(result.current.dieActive).toBe(false);
  });

  it("should open the intro phase", () => {
    const { result } = renderHook(() => usePayTabVerifyAddress());

    act(() => result.current.openIntro());

    expect(result.current.verifyAddress.phase).toBe("intro");
  });

  it("should mount the DIE and keep the intro visible until the executor is ready", () => {
    const { result } = renderHook(() => usePayTabVerifyAddress());

    act(() => result.current.openIntro());
    act(() => result.current.verifyAddress.onVerify());

    expect(result.current.verifyAddress.phase).toBe("intro");
    expect(result.current.dieActive).toBe(true);

    act(() => result.current.onReady());

    expect(result.current.verifyAddress.phase).toBe("hidden");
    expect(result.current.dieActive).toBe(true);
  });

  it("should keep the DIE mounted when hiding the intro fires onClose after it is ready", () => {
    const { result } = renderHook(() => usePayTabVerifyAddress());

    act(() => result.current.openIntro());
    act(() => result.current.verifyAddress.onVerify());
    act(() => result.current.onReady());
    act(() => result.current.verifyAddress.onClose());

    expect(result.current.dieActive).toBe(true);
    expect(result.current.verifyAddress.phase).toBe("hidden");
  });

  it("should unmount the DIE when the user dismisses the intro before it is ready", () => {
    const { result } = renderHook(() => usePayTabVerifyAddress());

    act(() => result.current.openIntro());
    act(() => result.current.verifyAddress.onVerify());
    act(() => result.current.verifyAddress.onClose());

    expect(result.current.dieActive).toBe(false);
    expect(result.current.verifyAddress.phase).toBe("hidden");
  });

  it("should unmount the DIE when the address is confirmed", () => {
    const { result } = renderHook(() => usePayTabVerifyAddress());

    act(() => result.current.openIntro());
    act(() => result.current.verifyAddress.onVerify());
    act(() => result.current.onExit("verified"));

    expect(result.current.verifyAddress.phase).toBe("hidden");
    expect(result.current.dieActive).toBe(false);
  });

  it("should hide the intro on close without starting the DIE", () => {
    const { result } = renderHook(() => usePayTabVerifyAddress());

    act(() => result.current.openIntro());
    act(() => result.current.verifyAddress.onClose());

    expect(result.current.verifyAddress.phase).toBe("hidden");
    expect(result.current.dieActive).toBe(false);
  });

  it("should not reopen the intro while the DIE is active", () => {
    const { result } = renderHook(() => usePayTabVerifyAddress());

    act(() => result.current.openIntro());
    act(() => result.current.verifyAddress.onVerify());
    act(() => result.current.onReady());
    act(() => result.current.openIntro());

    expect(result.current.verifyAddress.phase).toBe("hidden");
    expect(result.current.dieActive).toBe(true);
  });
});
