import { http, HttpResponse } from "msw";
import latestData from "./fixtures/fearAndGreed/latest.json";

const BASE_URL = "https://proxycmc.api.live.ledger.com/v3";

const handlers = [
  http.get(`${BASE_URL}/fear-and-greed/latest`, () => {
    return HttpResponse.json(latestData);
  }),
];

export default handlers;
