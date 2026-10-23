import { getPortfolioServiceUrl, PORTFOLIO_PROXY_PATH } from "./portfolioService";

describe("getPortfolioServiceUrl", () => {
  it("goes through the dev proxy when the service is configured", () => {
    expect(getPortfolioServiceUrl(" https://svc ", "http://localhost:3000", true)).toBe(
      `http://localhost:3000${PORTFOLIO_PROXY_PATH}`,
    );
  });

  it("is empty when nothing is configured", () => {
    expect(getPortfolioServiceUrl(undefined, "http://localhost:3000", true)).toBe("");
    expect(getPortfolioServiceUrl("  ", "http://localhost:3000", true)).toBe("");
  });

  it("is empty outside the dev server, where the proxy does not exist", () => {
    expect(getPortfolioServiceUrl("https://svc", "app://ledger", false)).toBe("");
  });
});
