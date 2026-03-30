import { parseDeepLink } from "../parseDeepLink";

describe("parseDeepLink", () => {
  it("extracts the hostname", () => {
    const result = parseDeepLink("earn");
    expect(result.hostname).toBe("earn");
  });

  it("extracts search params", () => {
    const result = parseDeepLink("earn?action=stake&currencyId=ethereum");
    expect(result.searchParams.get("action")).toBe("stake");
    expect(result.searchParams.get("currencyId")).toBe("ethereum");
  });

  it("populates query as a plain object", () => {
    const result = parseDeepLink("swap?fromToken=bitcoin&toToken=ethereum");
    expect(result.query).toEqual({ fromToken: "bitcoin", toToken: "ethereum" });
  });

  it("extracts the first path segment as platform", () => {
    const result = parseDeepLink("discover/paraswap");
    expect(result.platform).toBe("paraswap");
  });

  it("sets platform to empty string when there is no path segment", () => {
    const result = parseDeepLink("earn");
    expect(result.platform).toBe("");
  });

  it("preserves the rawPath exactly", () => {
    const path = "earn?action=stake&currencyId=ethereum";
    expect(parseDeepLink(path).rawPath).toBe(path);
  });

  it("returns a URL object", () => {
    const result = parseDeepLink("earn");
    expect(result.url).toBeInstanceOf(URL);
  });

  it("handles paths with no params", () => {
    const result = parseDeepLink("portfolio");
    expect(result.hostname).toBe("portfolio");
    expect(result.query).toEqual({});
  });

  it("handles nested paths", () => {
    const result = parseDeepLink("earn/deposit?cryptoAssetId=ethereum");
    expect(result.hostname).toBe("earn");
    expect(result.platform).toBe("deposit");
  });
});
