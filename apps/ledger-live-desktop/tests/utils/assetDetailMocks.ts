import { server, http, HttpResponse } from "tests/server";

export const MARKET_ENDPOINT = "https://countervalues.live.ledger.com/v3/markets";
export const DADA_ENDPOINT = "https://dada.api.ledger.com/v1/assets";

const emptyDadaPayload = () => ({
  cryptoAssets: {},
  networks: {},
  cryptoOrTokenCurrencies: {},
  interestRates: {},
  markets: {} as Record<string, unknown>,
  currenciesOrder: { key: "marketCap", order: "desc", metaCurrencyIds: [] as string[] },
});

export const mockMarket = {
  withData: (data: unknown[]) =>
    server.use(http.get(MARKET_ENDPOINT, () => HttpResponse.json(data))),
  empty: () => server.use(http.get(MARKET_ENDPOINT, () => HttpResponse.json([]))),
  hang: () => server.use(http.get(MARKET_ENDPOINT, () => new Promise(() => {}))),
  fail: (status = 500) =>
    server.use(http.get(MARKET_ENDPOINT, () => HttpResponse.json({}, { status }))),
  networkError: () => server.use(http.get(MARKET_ENDPOINT, () => HttpResponse.error())),
};

export const mockDada = {
  withMarkets: (markets: Record<string, unknown>) =>
    server.use(
      http.get(DADA_ENDPOINT, () => HttpResponse.json({ ...emptyDadaPayload(), markets })),
    ),
  empty: () => server.use(http.get(DADA_ENDPOINT, () => HttpResponse.json(emptyDadaPayload()))),
  fail: (status = 500) =>
    server.use(http.get(DADA_ENDPOINT, () => HttpResponse.json({}, { status }))),
  networkError: () => server.use(http.get(DADA_ENDPOINT, () => HttpResponse.error())),
};
