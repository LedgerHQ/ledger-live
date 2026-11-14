import { renderHook, withFlagOverrides } from "tests/testSetup";
import { startBorrowLifecycleMonitoring } from "@ledgerhq/transaction-observability";
import { useBorrowLifecycleMonitoring } from "./useBorrowLifecycleMonitoring";

jest.mock("@ledgerhq/transaction-observability", () => ({
  ...jest.requireActual("@ledgerhq/transaction-observability"),
  startBorrowLifecycleMonitoring: jest.fn(),
}));

const mockStart = jest.mocked(startBorrowLifecycleMonitoring);

describe("useBorrowLifecycleMonitoring", () => {
  beforeEach(() => jest.clearAllMocks());

  it("monitors the desktop Borrow webview and closes it on unmount", () => {
    const cleanup = jest.fn();
    mockStart.mockReturnValue(cleanup);

    const { unmount } = renderHook(() => useBorrowLifecycleMonitoring("borrow"), {
      initialState: withFlagOverrides({ borrowTxLifecycleMonitoring: { enabled: true } }),
    });

    expect(mockStart).toHaveBeenCalledWith("desktop", "borrow", true);

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("passes the kill-switch state down, off by default", () => {
    renderHook(() => useBorrowLifecycleMonitoring("borrow"));

    expect(mockStart).toHaveBeenCalledWith("desktop", "borrow", false);
  });
});
