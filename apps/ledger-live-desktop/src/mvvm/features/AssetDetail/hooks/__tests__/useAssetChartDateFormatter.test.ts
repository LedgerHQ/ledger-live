import { renderHook } from "tests/testSetup";
import { useAssetChartDateFormatter } from "../useAssetChartDateFormatter";

// 2024-01-02T03:04:00Z
const TIMESTAMP = Date.UTC(2024, 0, 2, 3, 4);

const renderFormatter = (range: Parameters<typeof useAssetChartDateFormatter>[0]) =>
  renderHook(() => useAssetChartDateFormatter(range), {
    initialState: { settings: { locale: "en-US" } },
  });

describe("useAssetChartDateFormatter", () => {
  it("formats with an hour-level format for the intraday (1d) range", () => {
    const { result } = renderFormatter("1d");
    const label = result.current(TIMESTAMP);
    // Hour format includes a time component (digits + AM/PM in en-US), no year.
    expect(label).toMatch(/\d/);
    expect(label).not.toMatch(/2024/);
  });

  it("formats with a day-level format for non-intraday ranges", () => {
    const { result } = renderFormatter("1y");
    expect(result.current(TIMESTAMP)).toContain("2024");
  });
});
