import { renderHook } from "@tests/test-renderer";
import { usePostOnboardingHubCompletionContext } from "../usePostOnboardingHubCompletionContext";

describe("usePostOnboardingHubCompletionContext", () => {
  it("should expose ledger sync, accounts and protectId", () => {
    const { result } = renderHook(() => usePostOnboardingHubCompletionContext());

    expect(result.current.isLedgerSyncActive).toBe(false);
    expect(result.current.accounts).toEqual([]);
    expect(result.current.protectId).toEqual(expect.any(String));
  });
});
