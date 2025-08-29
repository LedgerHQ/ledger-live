import { setupWorker } from "msw/browser";
import { http, HttpResponse } from "msw";
import { mockAssets } from "./dada/mockAssets";

const handlers = [
  http.get("https://dada.api.ledger-test.com/v1/assets", () => {
    return HttpResponse.json(mockAssets);
  }),
];

const mswWorker = setupWorker(...handlers);

export const startWorker = () =>
  mswWorker.start({
    onUnhandledRequest: "bypass",
  });
