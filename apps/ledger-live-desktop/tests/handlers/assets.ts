import { http, HttpResponse } from "msw";
import jsonResponse from "./fixtures/assets/getAssets.json";

const handlers = [
  http.get("https://dada.api.ledger-test.com/v1/assets", () => {
    return HttpResponse.json(jsonResponse);
  }),
  http.get("https://dada.api.ledger.com/v1/assets", () => {
    return HttpResponse.json(jsonResponse);
  }),
];

export default handlers;
