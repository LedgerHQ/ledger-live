import { http, HttpResponse } from "msw";
import supportedVsCurrenciesMock from "@mocks/api/market/supportedVsCurrencies.json";
import coinsListMock from "@mocks/api/market/coinsList.json";

const BASE_URL = "https://proxycg.api.live.ledger.com/api/v3";

/** Chart response shape required by MarketChartApiResponseSchema (prices, market_caps, total_volumes). */
const chartDataPoint = (): [number, number] => [Date.now() / 1000, 1000];
const chartResponse = () => ({
  prices: [chartDataPoint(), chartDataPoint()],
  market_caps: [chartDataPoint(), chartDataPoint()],
  total_volumes: [chartDataPoint(), chartDataPoint()],
});

const handlers = [
  http.get(`${BASE_URL}/coins/:coin/market_chart`, () => {
    return HttpResponse.json(chartResponse());
  }),
  http.get(`${BASE_URL}/simple/supported_vs_currencies`, () => {
    return HttpResponse.json(supportedVsCurrenciesMock);
  }),
  http.get(`${BASE_URL}/coins/list`, () => {
    return HttpResponse.json(coinsListMock);
  }),
];

export default handlers;
