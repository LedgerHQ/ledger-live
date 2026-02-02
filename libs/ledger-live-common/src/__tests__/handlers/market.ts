import { http, HttpResponse } from "msw";

const handlers = [
  http.get("*/v3/markets", () => {
    return HttpResponse.json([]);
  }),
];

export default handlers;
