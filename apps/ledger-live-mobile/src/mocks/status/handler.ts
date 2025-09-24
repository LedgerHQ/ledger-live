import { http, HttpResponse } from "msw";
import { mockLedgerStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/mocks/ledgerStatus";

const handler = [
  http.get("https://ledger.statuspage.io/api/v2/summary.json", () => {
    return HttpResponse.json(mockLedgerStatus);
  }),
];

export default handler;
