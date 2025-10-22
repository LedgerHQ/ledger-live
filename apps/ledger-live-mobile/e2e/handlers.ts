import { http, HttpResponse } from "msw";
import coingecko from "../__mocks__/api/market/coingecko.json";

export const handlers = [
  http.get("https://mapping-service.api.ledger.com/v1/coingecko/mapped-assets", () => {
    return HttpResponse.json(coingecko);
  }),
];
