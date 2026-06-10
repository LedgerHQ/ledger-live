import { act, renderHook } from "@testing-library/react";
import type { FeatureId } from "@shared/feature-flags";
import { useFlagSelection } from "./useFlagSelection";

const testFlagId: FeatureId = "mockFeature";

describe("useFlagSelection", () => {
  it("starts with no selection", () => {
    const { result } = renderHook(() => useFlagSelection());
    expect(result.current.selectedFlagId).toBeNull();
  });

  it("selects a flag", () => {
    const { result } = renderHook(() => useFlagSelection());
    act(() => result.current.selectFlag(testFlagId));
    expect(result.current.selectedFlagId).toBe(testFlagId);
  });

  it("clears the selection", () => {
    const { result } = renderHook(() => useFlagSelection());
    act(() => result.current.selectFlag(testFlagId));
    act(() => result.current.clearSelection());
    expect(result.current.selectedFlagId).toBeNull();
  });

  it("clearing when nothing is selected stays null", () => {
    const { result } = renderHook(() => useFlagSelection());
    act(() => result.current.clearSelection());
    expect(result.current.selectedFlagId).toBeNull();
  });

  it("keeps stable callback identities across renders", () => {
    const { result, rerender } = renderHook(() => useFlagSelection());
    const { selectFlag, clearSelection } = result.current;
    act(() => result.current.selectFlag(testFlagId));
    rerender();
    expect(result.current.selectFlag).toBe(selectFlag);
    expect(result.current.clearSelection).toBe(clearSelection);
  });
});
