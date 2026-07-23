import { buildSupportedCounterValues } from "../buildSupportedCounterValues";

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  getCryptoCurrencyById: (id: string) =>
    id === "bitcoin" ? { ticker: "BTC", name: "Bitcoin" } : { ticker: "ETH", name: "Ethereum" },
}));

const fiat = (ticker: string, name: string) => ({ ticker, name }) as never;

describe("buildSupportedCounterValues", () => {
  it("includes all provided fiats plus bitcoin and ethereum", () => {
    const result = buildSupportedCounterValues([fiat("USD", "US Dollar"), fiat("EUR", "Euro")]);
    expect(result.map(r => r.ticker)).toEqual(expect.arrayContaining(["USD", "EUR", "BTC", "ETH"]));
    expect(result).toHaveLength(4);
  });

  it("sorts results deterministically by currency name using localeCompare", () => {
    const result = buildSupportedCounterValues([fiat("USD", "US Dollar"), fiat("EUR", "Euro")]);
    const names = result.map(r => r.currency.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});
