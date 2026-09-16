import { renderHook, withFlagOverrides } from "@tests/test-renderer";
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

  it("starts and abandons a mobile dapp lifecycle", () => {
    const { unmount } = renderHook(() => useDappLifecycleMonitoring("kiln-widget"), {
      overrideInitialState: withFlagOverrides({ earnTxLifecycleMonitoring: { enabled: true } }),
    });

    expect(mockStart).toHaveBeenCalledWith("mobile", "kiln-widget");

    unmount();

    expect(mockAbandon).toHaveBeenCalledWith("mobile");
  });

  it("does not emit and clears pending state when disabled", () => {
    const { unmount } = renderHook(() => useDappLifecycleMonitoring("kiln-widget"), {
      overrideInitialState: withFlagOverrides({ earnTxLifecycleMonitoring: { enabled: false } }),
    });

    expect(mockStart).not.toHaveBeenCalled();
    expect(mockClear).toHaveBeenCalledWith("mobile");

    unmount();

    expect(mockAbandon).not.toHaveBeenCalled();
  });
});
