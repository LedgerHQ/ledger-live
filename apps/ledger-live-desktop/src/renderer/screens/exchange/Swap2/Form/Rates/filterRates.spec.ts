import { ExchangeRate } from "@ledgerhq/live-common/lib/exchange/swap/types";
import { filterRates } from "~/renderer/screens/exchange/Swap2/Form/Rates/filterRates";
import { FILTER } from "~/renderer/screens/exchange/Swap2/Form/utils";
const rates: ExchangeRate[] = [
  {
    providerType: "CEX",
    tradeMethod: "fixed",
    provider: "changelly",
  },
  {
    providerType: "DEX",
    tradeMethod: "fixed",
    provider: "oneinch",
  },
  {
    providerType: "CEX",
    tradeMethod: "float",
    provider: "other-cex-provider",
  },
  {
    providerType: "DEX",
    tradeMethod: "float",
    provider: "other-dex-provider",
  },
];
describe("filterRates", () => {
  it("does not apply any filters", () => {
    const filtered = filterRates(rates, []);
    expect(filtered).toEqual(rates);
  });
  it("filters centralised rates", () => {
    const filtered = filterRates(rates, [FILTER.centralised]);
    expect(filtered).toEqual([
      {
        providerType: "CEX",
        tradeMethod: "fixed",
        provider: "changelly",
      },
      {
        providerType: "CEX",
        tradeMethod: "float",
        provider: "other-cex-provider",
      },
    ]);
  });
  it("filters centralised floating rates", () => {
    const filtered = filterRates(rates, [FILTER.centralised, FILTER.float]);
    expect(filtered).toEqual([
      {
        providerType: "CEX",
        tradeMethod: "float",
        provider: "other-cex-provider",
      },
    ]);
  });
  it("filters centralised fixed rates", () => {
    const filtered = filterRates(rates, [FILTER.centralised, FILTER.fixed]);
    expect(filtered).toEqual([
      {
        providerType: "CEX",
        tradeMethod: "fixed",
        provider: "changelly",
      },
    ]);
  });
  it("filters decentralised rates", () => {
    const filtered = filterRates(rates, [FILTER.decentralised]);
    expect(filtered).toEqual([
      {
        providerType: "DEX",
        tradeMethod: "fixed",
        provider: "oneinch",
      },
      {
        providerType: "DEX",
        tradeMethod: "float",
        provider: "other-dex-provider",
      },
    ]);
  });
  it("filters decentralised floating rates", () => {
    const filtered = filterRates(rates, [FILTER.decentralised, FILTER.float]);
    expect(filtered).toEqual([
      {
        providerType: "DEX",
        tradeMethod: "float",
        provider: "other-dex-provider",
      },
    ]);
  });
  it("filters decentralised fixed rates", () => {
    const filtered = filterRates(rates, [FILTER.decentralised, FILTER.fixed]);
    expect(filtered).toEqual([
      {
        providerType: "DEX",
        tradeMethod: "fixed",
        provider: "oneinch",
      },
    ]);
  });
  it("filters fixed rates", () => {
    const filtered = filterRates(rates, [FILTER.fixed]);
    expect(filtered).toEqual([
      {
        providerType: "CEX",
        tradeMethod: "fixed",
        provider: "changelly",
      },
      {
        providerType: "DEX",
        tradeMethod: "fixed",
        provider: "oneinch",
      },
    ]);
  });
  it("filters floating rates", () => {
    const filtered = filterRates(rates, [FILTER.float]);
    expect(filtered).toEqual([
      {
        providerType: "CEX",
        tradeMethod: "float",
        provider: "other-cex-provider",
      },
      {
        providerType: "DEX",
        tradeMethod: "float",
        provider: "other-dex-provider",
      },
    ]);
  });
});
