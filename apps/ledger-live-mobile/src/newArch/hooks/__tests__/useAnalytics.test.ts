import { renderHook } from "@tests/test-renderer";
import useAnalytics from "../useAnalytics";
import { AnalyticContexts } from "../useAnalytics/enums";
import getAddAccountsMetadata from "../useAnalytics/data/addAccounts";

describe("useAnalytics", () => {
  it("should initialize with default values", () => {
    const { result } = renderHook(() => useAnalytics(AnalyticContexts.ReceiveFunds));
    expect(result.current.analyticsMetadata).toEqual({});
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() =>
      useAnalytics(AnalyticContexts.AddAccounts, "fakeSourceScreenName"),
    );
    expect(result.current.analyticsMetadata).toEqual(
      getAddAccountsMetadata("fakeSourceScreenName"),
    );
  });
});
