import { http, HttpResponse } from "msw";

const BASE_URL = "https://proxycg.api.live.ledger.com/api/v3";

const handlers = [
  http.get(`${BASE_URL}/coins/list`, () => {
    return HttpResponse.json([
      { id: "bitcoin", symbol: "btc", name: "Bitcoin" },
      { id: "ethereum", symbol: "eth", name: "Ethereum" },
    ]);
  }),
  http.get(`${BASE_URL}/simple/supported_vs_currencies`, () => {
    return HttpResponse.json(["usd", "eur", "gbp"]);
  }),
  http.get(`${BASE_URL}/coins/:coin/market_chart`, () => {
    return HttpResponse.json({
      prices: [
        [1700000000000, 50000],
        [1700003600000, 50100],
      ],
      market_caps: [
        [1700000000000, 1000000000000],
        [1700003600000, 1001000000000],
      ],
      total_volumes: [
        [1700000000000, 30000000000],
        [1700003600000, 30100000000],
      ],
    });
  }),
];

export default handlers;
