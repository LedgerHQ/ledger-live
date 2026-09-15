import { renderHook } from "@testing-library/react-native";
import { useDappLifecycleMonitoring } from "./useDappLifecycleMonitoring";

const mockGetFeature = jest.fn();
const mockStart = jest.fn();
const mockAbandon = jest.fn();
const mockClear = jest.fn();

jest.mock("@ledgerhq/live-common/firebase/featureFlags", () => ({
  getFeature: mockGetFeature,
}));
jest.mock("@ledgerhq/transaction-observability", () => ({
  startDappTxLifecycle: mockStart,
  abandonPendingDappTxLifecycle: mockAbandon,
  clearPendingDappTxLifecycle: mockClear,
}));

describe("useDappLifecycleMonitoring", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFeature.mockReturnValue({ enabled: true });
  });

  it("starts and abandons a mobile dapp lifecycle", () => {
    const { unmount } = renderHook(() => useDappLifecycleMonitoring("kiln-widget"));

    expect(mockStart).toHaveBeenCalledWith("mobile", "kiln-widget");

    unmount();

    expect(mockAbandon).toHaveBeenCalledWith("mobile");
  });

  it("does not emit and clears pending state when disabled", () => {
    mockGetFeature.mockReturnValue({ enabled: false });
    const { unmount } = renderHook(() => useDappLifecycleMonitoring("kiln-widget"));

    expect(mockStart).not.toHaveBeenCalled();

    unmount();

    expect(mockAbandon).not.toHaveBeenCalled();
    expect(mockClear).toHaveBeenCalledWith("mobile");
  });
});
