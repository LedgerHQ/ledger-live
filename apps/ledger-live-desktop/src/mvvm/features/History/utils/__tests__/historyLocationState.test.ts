import { parseHistoryBackPath } from "../historyLocationState";

describe("parseHistoryBackPath", () => {
  it("returns undefined for invalid state", () => {
    expect(parseHistoryBackPath(undefined)).toBeUndefined();
    expect(parseHistoryBackPath(null)).toBeUndefined();
    expect(parseHistoryBackPath({})).toBeUndefined();
    expect(parseHistoryBackPath({ historyBackPath: "" })).toBeUndefined();
    expect(parseHistoryBackPath({ historyBackPath: "../evil" })).toBeUndefined();
    expect(parseHistoryBackPath({ historyBackPath: "/portfolio" })).toBeUndefined();
    expect(parseHistoryBackPath({ historyBackPath: "/assets" })).toBeUndefined();
    expect(parseHistoryBackPath({ historyBackPath: "/assets?category=cryptos" })).toBeUndefined();
  });

  it("returns asset detail paths", () => {
    expect(parseHistoryBackPath({ historyBackPath: "/asset/bitcoin" })).toBe("/asset/bitcoin");
    expect(parseHistoryBackPath({ historyBackPath: "/asset" })).toBe("/asset");
  });
});
