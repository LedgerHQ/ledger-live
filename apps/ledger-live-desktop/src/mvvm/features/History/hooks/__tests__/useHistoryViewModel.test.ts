import { renderHook, act, waitFor, withFlagOverrides } from "tests/testSetup";
import { useNavigate, useLocation } from "react-router";
import { formatDustFilterThreshold, useHistoryViewModel } from "../useHistoryViewModel";
import { importCountervalues } from "@ledgerhq/live-countervalues/logic";
import type {
  CountervaluesSettings,
  CounterValuesStateRaw,
} from "@ledgerhq/live-countervalues/types";
import { getFiatCurrencyByTicker } from "@ledgerhq/live-common/currencies/index";
import type { CountervaluesState } from "~/renderer/reducers/countervalues";

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
const USD = getFiatCurrencyByTicker("USD");
const EUR = getFiatCurrencyByTicker("EUR");
const countervaluesSettings: CountervaluesSettings = {
  trackingPairs: [{ from: USD, to: EUR, startDate: new Date("2026-01-01T00:00:00.000Z") }],
  autofillGaps: false,
  refreshRate: 60000,
  marketCapBatchingAfterRank: 100,
};

const buildUsdEurCountervaluesState = (): CountervaluesState => ({
  countervalues: {
    state: importCountervalues(
      {
        status: {},
        "EUR USD": { latest: 0.92 },
      } as CounterValuesStateRaw,
      countervaluesSettings,
    ),
    pending: false,
    error: null,
  },
  polling: {
    isPolling: true,
    triggerLoad: false,
  },
  userSettings: countervaluesSettings,
});

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

  it("should format the dust filter threshold with the USD reference when the countervalue is not USD", () => {
    expect(
      formatDustFilterThreshold({
        countervaluesState: buildUsdEurCountervaluesState().countervalues.state,
        counterValueCurrency: EUR,
        locale: "en-US",
        thresholdUsd: 0.01,
      }),
    ).toBe("US$0.01 (€0.0092)");
  });

  it("should format the converted dust filter threshold with the current locale", () => {
    expect(
      formatDustFilterThreshold({
        countervaluesState: buildUsdEurCountervaluesState().countervalues.state,
        counterValueCurrency: EUR,
        locale: "fr-FR",
        thresholdUsd: 0.01,
      }),
    ).toBe("US$0,01 (€0,0092)");
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
});
