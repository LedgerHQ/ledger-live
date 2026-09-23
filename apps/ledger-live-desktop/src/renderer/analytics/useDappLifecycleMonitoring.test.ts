import { renderHook, withFlagOverrides } from "tests/testSetup";
import { startDappLifecycleMonitoring } from "@ledgerhq/transaction-observability";
import { hasStakeRedirectParams, useDappLifecycleMonitoring } from "./useDappLifecycleMonitoring";

jest.mock("@ledgerhq/transaction-observability", () => ({
  ...jest.requireActual("@ledgerhq/transaction-observability"),
  startDappLifecycleMonitoring: jest.fn(),
}));

const mockStart = jest.mocked(startDappLifecycleMonitoring);

describe("hasStakeRedirectParams", () => {
  it("accepts stake CTA parameters from every router input", () => {
    expect(hasStakeRedirectParams({ accountId: "account" }, "", {})).toBe(true);
    expect(hasStakeRedirectParams(null, "?yieldId=ethereum-staking", {})).toBe(true);
    expect(hasStakeRedirectParams(null, "", { accountId: "account" })).toBe(true);
  });

  it("rejects a plain Discover open", () => {
    expect(hasStakeRedirectParams(null, "", {})).toBe(false);
  });
});

describe("useDappLifecycleMonitoring", () => {
  beforeEach(() => jest.clearAllMocks());

  it("monitors a desktop dapp attempt and closes it on unmount", () => {
    const cleanup = jest.fn();
    mockStart.mockReturnValue(cleanup);

    const { unmount } = renderHook(() => useDappLifecycleMonitoring("stakekit", true), {
      initialState: withFlagOverrides({ earnTxLifecycleMonitoring: { enabled: true } }),
    });

    expect(mockStart).toHaveBeenCalledWith("desktop", "stakekit", true, true);

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("passes the kill-switch state down, so the library can drop pending attempts", () => {
    renderHook(() => useDappLifecycleMonitoring("stakekit", true), {
      initialState: withFlagOverrides({ earnTxLifecycleMonitoring: { enabled: false } }),
    });

    expect(mockStart).toHaveBeenCalledWith("desktop", "stakekit", true, false);
  });

  it("reports a catalog open that is not a stake redirect", () => {
    renderHook(() => useDappLifecycleMonitoring("stakekit", false), {
      initialState: withFlagOverrides({ earnTxLifecycleMonitoring: { enabled: true } }),
    });

    expect(mockStart).toHaveBeenCalledWith("desktop", "stakekit", false, true);
  });
});
