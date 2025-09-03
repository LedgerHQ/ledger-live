import { http, HttpResponse } from "msw";
import marketsMock from "@mocks/api/market/markets.json";
import supportedVsCurrenciesMock from "@mocks/api/market/supportedVsCurrencies.json";
import coinsListMock from "@mocks/api/market/coinsList.json";

const handlers = [
  http.get("https://countervalues.live.ledger.com/v3/markets", ({ request }) => {
    const searchParams = new URL(request.url).searchParams;

    let filteredData = marketsMock;

    // When we perform a search
    if (searchParams.get("filter")) {
      const coins = searchParams.get("filter")?.toLowerCase().split(",") || [];
      filteredData = marketsMock.filter(({ ticker }) => coins.includes(ticker));
    }
    // When we perform starred
    else if (searchParams.get("ids")) {
      const coins = searchParams.get("ids")?.split(",") || [];
      filteredData = marketsMock.filter(({ id }) => coins.includes(id));
    }

    const page = parseInt(searchParams.get("page") || "0");
    const pageSize = 10;
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return HttpResponse.json(paginatedData);
  }),
  http.get("https://proxycg.api.live.ledger.com/api/v3/coins/:coin/market_chart", ({ params }) => {
    return HttpResponse.json(marketsMock.find(({ id }) => id === params.coin));
  }),
  http.get("https://proxycg.api.live.ledger.com/api/v3/simple/supported_vs_currencies", () => {
    return HttpResponse.json(supportedVsCurrenciesMock);
  }),
  http.get("https://proxycg.api.live.ledger.com/api/v3/coins/list", () => {
    return HttpResponse.json(coinsListMock);
  }),
];

export default handlers;
