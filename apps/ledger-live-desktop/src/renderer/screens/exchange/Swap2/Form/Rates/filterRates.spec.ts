import { describe, it, expect } from "@jest/globals";
import { ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
import { filterRates } from "~/renderer/screens/exchange/Swap2/Form/Rates/filterRates";
import { FILTER } from "@ledgerhq/live-common/exchange/swap/utils/index";

const rates: Partial<ExchangeRate>[] = [
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
    const filtered = filterRates(rates as ExchangeRate[], []);
    expect(filtered).toEqual(rates);
  });

  it("filters centralised rates", () => {
    const filtered = filterRates(rates as ExchangeRate[], [FILTER.centralised]);
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
    const filtered = filterRates(rates as ExchangeRate[], [FILTER.centralised, FILTER.float]);
    expect(filtered).toEqual([
      {
        providerType: "CEX",
        tradeMethod: "float",
        provider: "other-cex-provider",
      },
    ]);
  });

  it("filters centralised fixed rates", () => {
    const filtered = filterRates(rates as ExchangeRate[], [FILTER.centralised, FILTER.fixed]);
    expect(filtered).toEqual([
      {
        providerType: "CEX",
        tradeMethod: "fixed",
        provider: "changelly",
      },
    ]);
  });

  it("filters decentralised rates", () => {
    const filtered = filterRates(rates as ExchangeRate[], [FILTER.decentralised]);
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
    const filtered = filterRates(rates as ExchangeRate[], [FILTER.decentralised, FILTER.float]);
    expect(filtered).toEqual([
      {
        providerType: "DEX",
        tradeMethod: "float",
        provider: "other-dex-provider",
      },
    ]);
  });

  it("filters decentralised fixed rates", () => {
    const filtered = filterRates(rates as ExchangeRate[], [FILTER.decentralised, FILTER.fixed]);
    expect(filtered).toEqual([
      {
        providerType: "DEX",
        tradeMethod: "fixed",
        provider: "oneinch",
      },
    ]);
  });

  it("filters fixed rates", () => {
    const filtered = filterRates(rates as ExchangeRate[], [FILTER.fixed]);
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
    const filtered = filterRates(rates as ExchangeRate[], [FILTER.float]);
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
