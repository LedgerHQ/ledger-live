import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { startDappLifecycleMonitoring } from "@ledgerhq/transaction-observability";
import { useDappLifecycleMonitoring } from "./useDappLifecycleMonitoring";

jest.mock("@ledgerhq/transaction-observability", () => ({
  ...jest.requireActual("@ledgerhq/transaction-observability"),
  startDappLifecycleMonitoring: jest.fn(),
}));

const mockStart = jest.mocked(startDappLifecycleMonitoring);

describe("useDappLifecycleMonitoring", () => {
  beforeEach(() => jest.clearAllMocks());

  it("monitors a mobile dapp attempt and closes it on unmount", () => {
    const cleanup = jest.fn();
    mockStart.mockReturnValue(cleanup);

    const { unmount } = renderHook(() => useDappLifecycleMonitoring("kiln-widget", true), {
      overrideInitialState: withFlagOverrides({ earnTxLifecycleMonitoring: { enabled: true } }),
    });

    expect(mockStart).toHaveBeenCalledWith("mobile", "kiln-widget", true, true);

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("passes the kill-switch state down, so the library can drop pending attempts", () => {
    renderHook(() => useDappLifecycleMonitoring("kiln-widget", true), {
      overrideInitialState: withFlagOverrides({ earnTxLifecycleMonitoring: { enabled: false } }),
    });

    expect(mockStart).toHaveBeenCalledWith("mobile", "kiln-widget", true, false);
  });

  it("reports a catalog open that is not a stake redirect", () => {
    renderHook(() => useDappLifecycleMonitoring("kiln-widget", false), {
      overrideInitialState: withFlagOverrides({ earnTxLifecycleMonitoring: { enabled: true } }),
    });

    expect(mockStart).toHaveBeenCalledWith("mobile", "kiln-widget", false, true);
  });
});
