import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useRecoverInOnboarding } from "./useRecoverInOnboarding";

function renderWithParams(params: { offerLedgerSync: boolean; recover?: boolean }) {
  return renderHook(() => useRecoverInOnboarding(), {
    overrideInitialState: withFlagOverrides({ deviceOnboarding: { enabled: true, params } }),
  });
}

describe("useRecoverInOnboarding", () => {
  it("should show Recover by default", () => {
    const { result } = renderHook(() => useRecoverInOnboarding());

    expect(result.current).toBe(true);
  });

  it("should show Recover when a saved value predates the param", () => {
    const { result } = renderWithParams({ offerLedgerSync: false });

    expect(result.current).toBe(true);
  });

  it("should show Recover when the param is on", () => {
    const { result } = renderWithParams({ offerLedgerSync: false, recover: true });

    expect(result.current).toBe(true);
  });

  it("should hide Recover when the param is off", () => {
    const { result } = renderWithParams({ offerLedgerSync: false, recover: false });

    expect(result.current).toBe(false);
  });
});
