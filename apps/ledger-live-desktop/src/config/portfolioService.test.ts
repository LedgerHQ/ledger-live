import { getPortfolioServiceUrl } from "./portfolioService";

describe("getPortfolioServiceUrl", () => {
  it("uses staging in development when nothing is configured", () => {
    expect(getPortfolioServiceUrl(undefined, true)).toBe(
      "https://portfolio-service.api.ledger-test.com",
    );
  });

  it("returns the configured url in development", () => {
    expect(getPortfolioServiceUrl(" https://svc.example ", true)).toBe("https://svc.example");
  });

  it("is off when the configured url is empty", () => {
    expect(getPortfolioServiceUrl("", true)).toBe("");
    expect(getPortfolioServiceUrl("  ", true)).toBe("");
  });

  it("is off outside development", () => {
    expect(getPortfolioServiceUrl("https://svc.example", false)).toBe("");
  });
});
