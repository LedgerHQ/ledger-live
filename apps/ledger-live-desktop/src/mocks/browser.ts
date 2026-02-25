import { setupWorker } from "msw/browser";
import { http, HttpResponse } from "msw";
import { mockAssets } from "./dada/mockAssets";
import { mockStablecoinsResponse } from "@ledgerhq/live-common/dada-client/mocks/stablecoins.mock";
import { mockLedgerStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/mocks/ledgerStatus";
import { mockFearAndGreedLatest } from "@ledgerhq/live-common/cmc-client/__mocks__/fearAndGreed.mock";

const assetsHandler = ({ request }: { request: Request }) => {
  const category = new URL(request.url).searchParams.get("category");
  if (category === "stablecoin") return HttpResponse.json(mockStablecoinsResponse);
  return HttpResponse.json(mockAssets);
};

const handlers = [
  http.get("https://dada.api.ledger-test.com/v1/assets", assetsHandler),
  http.get("https://dada.api.ledger.com/v1/assets", assetsHandler),
  http.get("https://ledger.statuspage.io/api/v2/summary.json", () => {
    return HttpResponse.json(mockLedgerStatus);
  }),
  http.get("https://proxycmc.api.live.ledger.com/v3/fear-and-greed/latest", () => {
    return HttpResponse.json(mockFearAndGreedLatest);
  }),
];

const mswWorker = setupWorker(...handlers);

export const startWorker = () => {
  mswWorker.start({
    onUnhandledRequest: "bypass",
  });
};
