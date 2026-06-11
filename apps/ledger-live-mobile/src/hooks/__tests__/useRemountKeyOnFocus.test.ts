import { renderHook } from "@testing-library/react-native";
import { useRemountKeyOnFocus } from "../useRemountKeyOnFocus";

let mockIsFocused = true;
jest.mock("@react-navigation/native", () => ({
  useIsFocused: () => mockIsFocused,
}));

describe("useRemountKeyOnFocus", () => {
  beforeEach(() => {
    mockIsFocused = true;
  });

  it("does not increment on the initial focus", () => {
    const { result } = renderHook(() => useRemountKeyOnFocus());
    expect(result.current).toBe(0);
  });

  it("increments when the screen is re-focused after a blur", () => {
    const { result, rerender } = renderHook(() => useRemountKeyOnFocus());
    expect(result.current).toBe(0);

    mockIsFocused = false;
    rerender({});
    expect(result.current).toBe(0);

    mockIsFocused = true;
    rerender({});
    expect(result.current).toBe(1);
  });

  it("increments once per blur → focus cycle", () => {
    const { result, rerender } = renderHook(() => useRemountKeyOnFocus());

    for (let i = 0; i < 2; i++) {
      mockIsFocused = false;
      rerender({});
      mockIsFocused = true;
      rerender({});
    }

    expect(result.current).toBe(2);
  });
});
