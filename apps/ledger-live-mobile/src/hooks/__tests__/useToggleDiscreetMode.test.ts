import { renderHook, act } from "@tests/test-renderer";
import { useToggleDiscreetMode } from "../useToggleDiscreetMode";

describe("useToggleDiscreetMode", () => {
  it("should toggle discreet mode", () => {
    const { result, store } = renderHook(() => useToggleDiscreetMode());

    expect(result.current.discreetMode).toBe(false);

    act(() => {
      result.current.toggleDiscreetMode();
    });

    expect(store.getState().settings.discreetMode).toBe(true);

    act(() => {
      result.current.toggleDiscreetMode();
    });

    expect(store.getState().settings.discreetMode).toBe(false);
  });
});
