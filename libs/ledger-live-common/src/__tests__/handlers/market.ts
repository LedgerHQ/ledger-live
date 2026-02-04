import { http, HttpResponse } from "msw";
import { createMockMarketItemResponse } from "../../market/utils/fixtures";

const handlers = [
  http.get("*/v3/markets", () => {
    return HttpResponse.json([createMockMarketItemResponse()]);
  }),
];

export default handlers;
