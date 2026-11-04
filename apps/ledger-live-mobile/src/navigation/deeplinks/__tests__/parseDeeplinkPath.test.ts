import { parseDeeplinkPath } from "../parseDeeplinkPath";

describe("parseDeeplinkPath", () => {
  it("reads a custom scheme deeplink path", () => {
    const url = parseDeeplinkPath("predictions?eventSlug=abc");

    expect(url.hostname).toBe("predictions");
    expect(url.searchParams.get("eventSlug")).toBe("abc");
  });

  it("reads a universal link path like a custom scheme one", () => {
    const url = parseDeeplinkPath("/swap/history?swapId=123");

    expect(url.hostname).toBe("swap");
    expect(url.pathname).toBe("/history");
    expect(url.searchParams.get("swapId")).toBe("123");
  });
});
