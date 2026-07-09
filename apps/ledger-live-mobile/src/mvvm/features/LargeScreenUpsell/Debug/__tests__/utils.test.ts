import { parseDateOrOffset } from "../utils";

describe("parseDateOrOffset", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns undefined for empty or blank input", () => {
    expect(parseDateOrOffset("")).toBeUndefined();
    expect(parseDateOrOffset("   ")).toBeUndefined();
  });

  it("returns undefined for an unparseable string", () => {
    expect(parseDateOrOffset("not-a-date")).toBeUndefined();
  });

  it("parses an exact ISO date", () => {
    const iso = "2026-06-01T00:00:00.000Z";
    expect(parseDateOrOffset(iso)?.toISOString()).toBe(iso);
  });

  it("parses a day offset where today = 0", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-07-10T12:00:00.000Z"));

    expect(parseDateOrOffset("0")?.toDateString()).toBe(new Date("2026-07-10T12:00:00.000Z").toDateString());
    expect(parseDateOrOffset("1")?.toDateString()).toBe(new Date("2026-07-09T12:00:00.000Z").toDateString());
  });
});
