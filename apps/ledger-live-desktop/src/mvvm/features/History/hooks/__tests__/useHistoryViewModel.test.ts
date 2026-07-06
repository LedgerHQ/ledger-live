import { renderHook, act, waitFor, withFlagOverrides } from "tests/testSetup";
import { useNavigate, useLocation } from "react-router";
import { useHistoryViewModel } from "../useHistoryViewModel";
import { track } from "~/renderer/analytics/segment";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock("../useHistoryOperations", () => ({
  useHistoryOperations: () => [],
}));

jest.mock("../useHistoryTable", () => ({
  useHistoryTable: () => ({
    getRowModel: () => ({ rows: [] }),
    getHeaderGroups: () => [],
  }),
}));

jest.mock("../useHistoryVirtualization", () => ({
  useHistoryVirtualization: () => ({
    parentRef: { current: null },
    rowVirtualizer: { getVirtualItems: () => [], getTotalSize: () => 0 },
    flatItems: [],
  }),
}));

const mockNavigate = jest.fn();
const mockUseNavigate = jest.mocked(useNavigate);
const mockUseLocation = jest.mocked(useLocation);

describe("useHistoryViewModel navigateBack", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseLocation.mockReturnValue({
      pathname: "/history",
      state: null,
      key: "default",
      search: "",
      hash: "",
    });
  });

  it("shows back button and pops the stack when historyBackPath is set", () => {
    mockUseLocation.mockReturnValue({
      pathname: "/history",
      state: { historyBackPath: "/asset/bitcoin" },
      key: "default",
      search: "",
      hash: "",
    });

    const { result } = renderHook(() => useHistoryViewModel());

    expect(result.current.showBackButton).toBe(true);

    act(() => {
      result.current.navigateBack();
    });

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("hides back button when historyBackPath is missing", () => {
    const { result } = renderHook(() => useHistoryViewModel());

    expect(result.current.showBackButton).toBe(false);
  });

  it("should format the dust filter threshold in USD without a reference conversion", () => {
    const { result } = renderHook(() => useHistoryViewModel(), {
      initialState: {
        settings: { counterValue: "USD", locale: "en-US" },
        ...withFlagOverrides({ lwdDustFiltering: { enabled: true } }),
      },
    });

    expect(result.current.dustFilterThreshold).toBe("US$0.01");
  });

  it("should request USD countervalue tracking when the dust filter option is shown for a non-USD countervalue", async () => {
    const { store } = renderHook(() => useHistoryViewModel(), {
      initialState: {
        settings: { counterValue: "EUR", locale: "en-US" },
        ...withFlagOverrides({ lwdDustFiltering: { enabled: true } }),
      },
    });

    await waitFor(() =>
      expect(store.getState().countervaluesExtraTracking.extraTrackingPairs).toEqual([
        expect.objectContaining({
          from: expect.objectContaining({ ticker: "USD" }),
          to: expect.objectContaining({ ticker: "EUR" }),
        }),
      ]),
    );
  });

  it("should not request USD countervalue tracking when the dust filter option is hidden", () => {
    const { store } = renderHook(() => useHistoryViewModel(), {
      initialState: {
        settings: { counterValue: "EUR", locale: "en-US" },
        ...withFlagOverrides({ lwdDustFiltering: { enabled: false } }),
      },
    });

    expect(store.getState().countervaluesExtraTracking.extraTrackingPairs).toEqual([]);
  });

  it("should track the target dust filter state when toggling dust filtering", () => {
    const { result, store } = renderHook(() => useHistoryViewModel(), {
      initialState: {
        settings: { hideSmallValueTokenOperations: false },
        ...withFlagOverrides({ lwdDustFiltering: { enabled: true } }),
      },
    });

    act(() => {
      result.current.onToggleHideSmallValueTokenOperations();
    });

    expect(store.getState().settings.hideSmallValueTokenOperations).toBe(true);
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "dust_filter",
      enabled: true,
    });

    act(() => {
      result.current.onToggleHideSmallValueTokenOperations();
    });

    expect(store.getState().settings.hideSmallValueTokenOperations).toBe(false);
    expect(track).toHaveBeenLastCalledWith("button_clicked", {
      button: "dust_filter",
      enabled: false,
    });
  });
});
