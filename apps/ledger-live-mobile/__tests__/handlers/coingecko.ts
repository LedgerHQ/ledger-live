import { http, HttpResponse } from "msw";
import marketsMock from "@mocks/api/market/markets.json";

const BASE_URL = "https://proxycg.api.live.ledger.com/api/v3";

const handlers = [
  http.get(`${BASE_URL}/coins/:coin/market_chart`, ({ params }) => {
    return HttpResponse.json(marketsMock.find(({ id }) => id === params.coin));
  }),
];

export default handlers;
