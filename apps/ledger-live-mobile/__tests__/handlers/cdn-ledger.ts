import { http, HttpResponse } from "msw";

const minimalSvg = "<svg xmlns=\"http://www.w3.org/2000/svg\"/>";

const handlers = [
  http.get("https://cdn.live.ledger.com/icons/providers/boxed/buy-sell-ui.svg", () => {
    return new HttpResponse(minimalSvg, {
      status: 200,
      headers: { "Content-Type": "image/svg+xml" },
    });
  }),
];

export default handlers;
