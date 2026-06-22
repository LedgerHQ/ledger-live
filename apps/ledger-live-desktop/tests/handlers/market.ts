import { http, HttpResponse } from "msw";
import { MarketMockedResponse } from "./fixtures/market";

const handlers = [
  http.get("https://countervalues.live.ledger.com/v3/markets", ({ request }) => {
    const url = new URL(request.url);
    const ids = url.searchParams.get("ids");

    const idsSplit = ids?.split(",");
    if (idsSplit?.length === 1 && idsSplit[0] === "bitcoin") {
      return HttpResponse.json(MarketMockedResponse.bitcoinDetail);
    } else {
      return HttpResponse.json(MarketMockedResponse.marketList);
    }
  }),
  http.get("https://countervalues.live.ledger.com/v3/markets/chart/:range/:id", () => {
    return HttpResponse.json({
      values: [
        [1700000000000, 50000],
        [1700003600000, 50100],
      ],
    });
  }),
  http.get("https://countervalues.live.ledger.com/v3/markets/global", () => {
    return HttpResponse.json({
      marketCap: 2_500_000_000_000,
      percentageChanges: { "1d": 0.0214 },
    });
  }),
  http.get("https://countervalues.live.ledger.com/v3/categories/trending", () => {
    return HttpResponse.json([]);
  }),
  http.get("https://countervalues.live.ledger.com/v3/currencies/trending", () => {
    return HttpResponse.json([
      { id: "bitcoin", supported: true },
      { id: "ethereum", supported: true },
      { id: "solana", supported: true },
    ]);
  }),
];

export default handlers;
