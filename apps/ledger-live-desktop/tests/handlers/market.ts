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
];

export default handlers;
