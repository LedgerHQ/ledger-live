import { renderHook, withFlagOverrides } from "tests/testSetup";
import {
  abandonPendingDappTxLifecycle,
  clearPendingDappTxLifecycle,
  startDappTxLifecycle,
} from "@ledgerhq/transaction-observability";
import { useDappLifecycleMonitoring } from "./useDappLifecycleMonitoring";
import { setEarnTxLifecycleFlagReader } from "./earnTxLifecycleFlag";

jest.mock("@ledgerhq/transaction-observability", () => ({
  ...jest.requireActual("@ledgerhq/transaction-observability"),
  startDappTxLifecycle: jest.fn(),
  abandonPendingDappTxLifecycle: jest.fn(),
  clearPendingDappTxLifecycle: jest.fn(),
}));

const mockStart = jest.mocked(startDappTxLifecycle);
const mockAbandon = jest.mocked(abandonPendingDappTxLifecycle);
const mockClear = jest.mocked(clearPendingDappTxLifecycle);
let lifecycleEnabled = true;

describe("useDappLifecycleMonitoring", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lifecycleEnabled = true;
    setEarnTxLifecycleFlagReader(() => lifecycleEnabled);
  });
  afterEach(() => setEarnTxLifecycleFlagReader(null));

  it("starts and abandons a desktop dapp lifecycle", () => {
    const { unmount } = renderHook(() => useDappLifecycleMonitoring("stakekit", true), {
      initialState: withFlagOverrides({ earnTxLifecycleMonitoring: { enabled: true } }),
    });

    expect(mockStart).toHaveBeenCalledWith("desktop", "stakekit");

    unmount();

    expect(mockAbandon).toHaveBeenCalledWith("desktop", "stakekit");
  });

  it("does not emit and clears pending state when disabled", () => {
    lifecycleEnabled = false;
    const { unmount } = renderHook(() => useDappLifecycleMonitoring("stakekit", true), {
      initialState: withFlagOverrides({ earnTxLifecycleMonitoring: { enabled: false } }),
    });

    expect(mockStart).not.toHaveBeenCalled();
    expect(mockClear).toHaveBeenCalledWith("desktop", "stakekit");

    unmount();

    expect(mockAbandon).not.toHaveBeenCalled();
  });

  it("ignores a catalog open that is not a stake redirect", () => {
    const { unmount } = renderHook(() => useDappLifecycleMonitoring("stakekit", false), {
      initialState: withFlagOverrides({ earnTxLifecycleMonitoring: { enabled: true } }),
    });

    expect(mockStart).not.toHaveBeenCalled();
    expect(mockClear).not.toHaveBeenCalled();
    unmount();
    expect(mockAbandon).not.toHaveBeenCalled();
  });
});
