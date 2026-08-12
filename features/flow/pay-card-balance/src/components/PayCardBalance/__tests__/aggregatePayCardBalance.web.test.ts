import { aggregatePayCardBalance } from "../aggregatePayCardBalance";
import type { FormattedValue, PayCardPortfolioPort } from "../types";

const formatCountervalue = (): FormattedValue => ({}) as unknown as FormattedValue;

function buildPort(overrides: Partial<PayCardPortfolioPort> = {}): PayCardPortfolioPort {
  return {
    stablecoins: [],
    filter: "all",
    isLoading: false,
    isError: false,
    formatCountervalue,
    ...overrides,
  };
}

const usdc = { currency: { id: "ethereum/erc20/usdc" }, value: 1000 };
const usdt = { currency: { id: "ethereum/erc20/usdt" }, value: 250.5 };

describe("aggregatePayCardBalance", () => {
  it("should sum every stablecoin countervalue when the filter is all", () => {
    const data = aggregatePayCardBalance(buildPort({ stablecoins: [usdc, usdt] }));

    expect(data.stableBalance).toBe(1250.5);
    expect(data.status).toBe("ready");
    expect(data.filter).toBe("all");
  });

  it("should sum only the matching stablecoin when the filter is a currencyId", () => {
    const data = aggregatePayCardBalance(
      buildPort({ stablecoins: [usdc, usdt], filter: "ethereum/erc20/usdc" }),
    );

    expect(data.stableBalance).toBe(1000);
    expect(data.filter).toBe("ethereum/erc20/usdc");
  });

  it("should report loading while the portfolio is loading", () => {
    const data = aggregatePayCardBalance(buildPort({ stablecoins: [usdc], isLoading: true }));

    expect(data.status).toBe("loading");
  });

  it("should report error when the portfolio errors, regardless of loading", () => {
    const data = aggregatePayCardBalance(
      buildPort({ stablecoins: [usdc], isLoading: true, isError: true }),
    );

    expect(data.status).toBe("error");
  });

  it("should forward the countervalue formatter untouched", () => {
    const data = aggregatePayCardBalance(buildPort());

    expect(data.formatCountervalue).toBe(formatCountervalue);
  });
});
