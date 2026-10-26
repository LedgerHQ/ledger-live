import { getPortfolioServiceUrl } from "./portfolioService";

describe("getPortfolioServiceUrl", () => {
  it("returns the configured url in development", () => {
    expect(getPortfolioServiceUrl(" https://svc.example ", true)).toBe("https://svc.example");
  });

  it("is empty when nothing is configured", () => {
    expect(getPortfolioServiceUrl(undefined, true)).toBe("");
    expect(getPortfolioServiceUrl("  ", true)).toBe("");
  });

  it("is empty outside development", () => {
    expect(getPortfolioServiceUrl("https://svc.example", false)).toBe("");
  });
});
