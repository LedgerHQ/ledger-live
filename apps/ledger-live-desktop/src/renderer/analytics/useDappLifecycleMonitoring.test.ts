import { renderHook, withFlagOverrides } from "tests/testSetup";
import {
  abandonPendingDappTxLifecycle,
  clearPendingTxLifecycle,
  startDappTxLifecycle,
} from "@ledgerhq/transaction-observability";
import { useDappLifecycleMonitoring } from "./useDappLifecycleMonitoring";

jest.mock("@ledgerhq/transaction-observability", () => ({
  ...jest.requireActual("@ledgerhq/transaction-observability"),
  startDappTxLifecycle: jest.fn(),
  abandonPendingDappTxLifecycle: jest.fn(),
  clearPendingTxLifecycle: jest.fn(),
}));

const mockStart = jest.mocked(startDappTxLifecycle);
const mockAbandon = jest.mocked(abandonPendingDappTxLifecycle);
const mockClear = jest.mocked(clearPendingTxLifecycle);

describe("useDappLifecycleMonitoring", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("starts and abandons a desktop dapp lifecycle", () => {
    const { unmount } = renderHook(() => useDappLifecycleMonitoring("stakekit"), {
      initialState: withFlagOverrides({ earnTxLifecycleMonitoring: { enabled: true } }),
    });

    expect(mockStart).toHaveBeenCalledWith("desktop", "stakekit");

    unmount();

    expect(mockAbandon).toHaveBeenCalledWith("desktop");
  });

  it("does not emit and clears pending state when disabled", () => {
    const { unmount } = renderHook(() => useDappLifecycleMonitoring("stakekit"), {
      initialState: withFlagOverrides({ earnTxLifecycleMonitoring: { enabled: false } }),
    });

    expect(mockStart).not.toHaveBeenCalled();
    expect(mockClear).toHaveBeenCalledWith("desktop");

    unmount();

    expect(mockAbandon).not.toHaveBeenCalled();
  });
});
