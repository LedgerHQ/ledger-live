import { setupWorker } from "msw/browser";
import { http, HttpResponse } from "msw";
import { mockAssets } from "./dada/mockAssets";
import { mockLedgerStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/mocks/ledgerStatus";

const handlers = [
  http.get("https://dada.api.ledger-test.com/v1/assets", () => {
    return HttpResponse.json(mockAssets);
  }),
  http.get("https://ledger.statuspage.io/api/v2/summary.json", () => {
    return HttpResponse.json(mockLedgerStatus);
  }),
];

const mswWorker = setupWorker(...handlers);

export const startWorker = () => {
  mswWorker.start({
    onUnhandledRequest: "bypass",
  });
};
