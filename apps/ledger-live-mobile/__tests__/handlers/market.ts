import { http, HttpResponse } from "msw";
import marketsMock from "@mocks/api/market/markets.json";

const handlers = [
  http.get("https://countervalues.live.ledger.com/v3/markets", ({ request }) => {
    const searchParams = new URL(request.url).searchParams;

    let filteredData = marketsMock;

    // When we perform a search
    if (searchParams.get("filter")) {
      const coins = searchParams.get("filter")?.toLowerCase().split(",") || [];
      filteredData = marketsMock.filter(({ name, ticker }) =>
        coins.some(coin => ticker.toLowerCase().includes(coin) || name.toLowerCase().includes(coin)),
      );
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
  http.get("https://countervalues.live.ledger.com/v3/supported/fiat", () => {
    return HttpResponse.json(["usd", "eur", "gbp"]);
  }),
  http.get("https://countervalues.live.ledger.com/v3/markets/chart/:range/:id", () => {
    return HttpResponse.json({
      values: [
        [1700000000000, 50000],
        [1700003600000, 50100],
      ],
    });
  }),
];

export default handlers;
