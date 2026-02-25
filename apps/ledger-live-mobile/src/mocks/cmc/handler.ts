import { http, HttpResponse } from "msw";
import { mockFearAndGreedLatest } from "@ledgerhq/live-common/cmc-client/__mocks__/fearAndGreed.mock";

const handler = () => {
  return HttpResponse.json(mockFearAndGreedLatest);
};

const handlers = [
  http.get("https://proxycmc.api.live.ledger.com/v3/fear-and-greed/latest", handler),
];

export default handlers;
