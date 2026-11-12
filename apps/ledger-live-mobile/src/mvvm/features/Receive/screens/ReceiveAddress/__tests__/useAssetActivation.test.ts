import { act, renderHook } from "@testing-library/react-native";
import { useAssetActivation } from "../useAssetActivation";

function focusSource() {
  const listeners: Array<() => void> = [];
  return {
    addListener: (_event: "focus", listener: () => void) => {
      listeners.push(listener);
      return () => undefined;
    },
    focus: () => listeners.forEach(listener => listener()),
  };
}

describe("useAssetActivation", () => {
  it("reads the token again when the screen is back in focus after the family flow", () => {
    const navigation = focusSource();
    const refresh = jest.fn().mockResolvedValue(undefined);
    const openFlow = jest.fn();
    const { result } = renderHook(() => useAssetActivation(navigation, refresh));

    act(() => result.current.run(openFlow));
    expect(openFlow).toHaveBeenCalledTimes(1);
    act(() => navigation.focus());

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(result.current.hasReturned).toBe(true);
  });

  it("ignores a focus that does not follow an activation", () => {
    const navigation = focusSource();
    const refresh = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAssetActivation(navigation, refresh));

    act(() => navigation.focus());

    expect(refresh).not.toHaveBeenCalled();
    expect(result.current.hasReturned).toBe(false);
  });
});
