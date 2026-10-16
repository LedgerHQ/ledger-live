import { statusLine } from "./AccountData.internals";

describe("statusLine", () => {
  it("prefers the error, then the read in flight, then who answered and when", () => {
    expect(statusLine(undefined)).toBe("nothing stored");
    expect(statusLine({ pending: true, error: "down" })).toBe("down");
    expect(statusLine({ pending: true })).toBe("reading…");
    expect(statusLine({ pending: false })).toBe("not read yet");
    expect(statusLine({ pending: false, sourceId: "full-sync", readAt: 1000 }, 6000)).toBe(
      "served by full-sync · 5s ago",
    );
  });

  it("shows the stored cursor of a paginated kind", () => {
    expect(statusLine({ pending: false, sourceId: "coin-module", nextCursor: "c1" })).toBe(
      "served by coin-module · next cursor c1",
    );
  });
});
