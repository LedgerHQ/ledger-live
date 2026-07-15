import { buildChartDateFormatters } from "../buildChartDateFormatters";

describe("buildChartDateFormatters", () => {
  const timestamp = new Date("2026-06-28T14:30:00Z").getTime();
  const formatters = buildChartDateFormatters("en-US");

  it("formats axis dates with time for the 1d range", () => {
    expect(formatters.formatAxisDate(timestamp, "1d")).toMatch(/\d/);
    expect(formatters.formatAxisDate(timestamp, "1d")).not.toBe(
      formatters.formatAxisDate(timestamp, "1w"),
    );
  });

  it("formats scrub header dates with time and date for mid-length ranges", () => {
    const scrubLabel = formatters.formatScrubHeaderDate(timestamp, "1w");
    expect(scrubLabel).toMatch(/\d/);
    expect(scrubLabel).not.toBe(formatters.formatScrubHeaderDate(timestamp, "1y"));
  });
});
