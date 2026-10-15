import { http, HttpResponse } from "msw";

const handlers = [
  http.get("*/v1/tokens", () => HttpResponse.json([])),
  http.get("*/v1/currencies", () => HttpResponse.json([])),
];

export default handlers;
