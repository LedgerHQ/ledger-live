import { parseHistoryBackPath } from "../historyLocationState";

describe("parseHistoryBackPath", () => {
  it("returns undefined for invalid state", () => {
    expect(parseHistoryBackPath(undefined)).toBeUndefined();
    expect(parseHistoryBackPath(null)).toBeUndefined();
    expect(parseHistoryBackPath({})).toBeUndefined();
    expect(parseHistoryBackPath({ historyBackPath: "" })).toBeUndefined();
    expect(parseHistoryBackPath({ historyBackPath: "../evil" })).toBeUndefined();
    expect(parseHistoryBackPath({ historyBackPath: "/history" })).toBeUndefined();
  });

  it("returns pathname for a safe in-app path", () => {
    expect(parseHistoryBackPath({ historyBackPath: "/asset/bitcoin" })).toBe("/asset/bitcoin");
    expect(parseHistoryBackPath({ historyBackPath: "/asset/ethereum" })).toBe("/asset/ethereum");
  });

  it("preserves search and strips hash from historyBackPath", () => {
    expect(parseHistoryBackPath({ historyBackPath: "/asset/bitcoin?tab=transactions" })).toBe(
      "/asset/bitcoin?tab=transactions",
    );
    expect(parseHistoryBackPath({ historyBackPath: "/asset/bitcoin#chart" })).toBe(
      "/asset/bitcoin",
    );
  });
});
