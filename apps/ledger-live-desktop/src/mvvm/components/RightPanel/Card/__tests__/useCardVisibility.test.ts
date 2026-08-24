import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useCardVisibility } from "../useCardVisibility";

describe("useCardVisibility", () => {
  it("returns true when lwdPayTab is enabled", () => {
    const { result } = renderHook(() => useCardVisibility(), {
      initialState: withFlagOverrides({
        lwdPayTab: { enabled: true },
      }),
    });

    expect(result.current).toBe(true);
  });

  it("returns false when lwdPayTab is absent", () => {
    const { result } = renderHook(() => useCardVisibility());

    expect(result.current).toBe(false);
  });
});
