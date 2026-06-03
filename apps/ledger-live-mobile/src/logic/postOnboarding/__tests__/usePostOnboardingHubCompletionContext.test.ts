import { renderHook } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { usePostOnboardingHubCompletionContext } from "../usePostOnboardingHubCompletionContext";

function withProductTourCompleted(completed: boolean) {
  return (state: State): State => ({
    ...state,
    settings: {
      ...state.settings,
      productTourCompleted: completed,
    },
  });
}

describe("usePostOnboardingHubCompletionContext", () => {
  it("should expose productTourCompleted from settings", () => {
    const { result } = renderHook(() => usePostOnboardingHubCompletionContext(), {
      overrideInitialState: withProductTourCompleted(true),
    });

    expect(result.current.productTourCompleted).toBe(true);
  });

  it("should default productTourCompleted to false", () => {
    const { result } = renderHook(() => usePostOnboardingHubCompletionContext(), {
      overrideInitialState: withProductTourCompleted(false),
    });

    expect(result.current.productTourCompleted).toBe(false);
  });
});
