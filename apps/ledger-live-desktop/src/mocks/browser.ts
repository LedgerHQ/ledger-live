import { setupWorker } from "msw/browser";
import { http, HttpResponse } from "msw";
import { mockAssets } from "./dada/mockAssets";
import { mockStablecoinsResponse } from "@domain/api-aggregated-assets/mock/stablecoins";
import { mockStocksResponse } from "@domain/api-aggregated-assets/mock/stocks";
import { mockLedgerStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/mocks/ledgerStatus";
import { mockFearAndGreedLatest } from "@domain/api-market-sentiment/mock";
import { getMockCardOnboardingStatus } from "@domain/api-card-management/mock";
import countervaluesHandlers from "../../tests/handlers/countervalues";
import marketHandlers from "../../tests/handlers/market";

const assetsHandler = ({ request }: { request: Request }) => {
  const category = new URL(request.url).searchParams.get("categories");
  if (category === "stablecoins") return HttpResponse.json(mockStablecoinsResponse);
  if (category === "stocks") return HttpResponse.json(mockStocksResponse);
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
  ...marketHandlers,
  ...countervaluesHandlers,
  http.get("*/v1/card/onboarding-status", () => HttpResponse.json(getMockCardOnboardingStatus())),
];

const mswWorker = setupWorker(...handlers);

export const startWorker = () => {
  mswWorker.start({
    onUnhandledRequest: "bypass",
  });
};
