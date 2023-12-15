import { http, HttpResponse } from "msw";
import marketsMock from "../../__mocks__/market/markets.json";
import supportedVsCurrenciesMock from "../../__mocks__/market/supportedVsCurrencies.json";
import coinsListMock from "../../__mocks__/market/coinsList.json";

const handlers = [
  http.get("https://proxycg.api.live.ledger.com/api/v3/coins/markets", ({ request }) => {
    const searchParams = new URLSearchParams(request.url);
    // When we perform a search
    if (searchParams.get("ids")) {
      const coins = searchParams.get("ids")?.split(",") || [];
      return HttpResponse.json(marketsMock.filter(({ id }) => coins.includes(id)));
    }
    return HttpResponse.json(marketsMock);
  }),
  http.get("https://proxycg.api.live.ledger.com/api/v3/simple/supported_vs_currencies", () => {
    return HttpResponse.json(supportedVsCurrenciesMock);
  }),
  http.get("https://proxycg.api.live.ledger.com/api/v3/coins/list", () => {
    return HttpResponse.json(coinsListMock);
  }),
];

export default handlers;
