import { PortfolioId } from "./PortfolioId";

describe("PortfolioId", () => {
  it("rejects an empty id", () => {
    expect(() => PortfolioId.fromString("  ")).toThrow("PortfolioId must be a non-empty string");
  });

  it("is redacted when printed or serialized", () => {
    const id = PortfolioId.fromString("secret-portfolio");
    expect(String(id)).toBe("[PortfolioId:REDACTED]");
    expect(JSON.stringify({ id })).toBe('{"id":"[PortfolioId:REDACTED]"}');
  });

  it("gives its value for persistence only", () => {
    expect(PortfolioId.fromString("p-1").exportPortfolioIdForPersistence()).toBe("p-1");
  });

  it("compares by value", () => {
    expect(PortfolioId.fromString("a").equals(PortfolioId.fromString("a"))).toBe(true);
    expect(PortfolioId.fromString("a").equals(PortfolioId.fromString("b"))).toBe(false);
  });
});
