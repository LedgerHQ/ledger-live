import { sanitizeMarketTerm, MAX_MARKET_TERM_LENGTH } from "./sanitizeMarketTerm";

describe("sanitizeMarketTerm", () => {
  it("lowercases and trims", () => {
    expect(sanitizeMarketTerm("  WLFI  ")).toBe("wlfi");
  });

  it("keeps coin ids, slugs and names with spaces", () => {
    expect(sanitizeMarketTerm("hedera-hashgraph")).toBe("hedera-hashgraph");
    expect(sanitizeMarketTerm("World Liberty Financial")).toBe("world liberty financial");
    expect(sanitizeMarketTerm("usd.coin_v2")).toBe("usd.coin_v2");
  });

  it("strips disallowed characters", () => {
    expect(sanitizeMarketTerm("<script>alert(1)</script>")).toBe("scriptalert1script");
    expect(sanitizeMarketTerm("wlfi?x=1&y=2")).toBe("wlfix1y2");
    expect(sanitizeMarketTerm("../../etc/passwd")).toBe("....etcpasswd");
  });

  it("collapses internal whitespace", () => {
    expect(sanitizeMarketTerm("a   b")).toBe("a b");
  });

  it("caps the length", () => {
    expect(sanitizeMarketTerm("a".repeat(200))).toHaveLength(MAX_MARKET_TERM_LENGTH);
  });

  it.each([null, undefined, "", "   ", "@#$%"])("returns null for %p", input => {
    expect(sanitizeMarketTerm(input)).toBeNull();
  });
});
