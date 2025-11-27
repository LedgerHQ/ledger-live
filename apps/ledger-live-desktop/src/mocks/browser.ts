import { setupWorker } from "msw/browser";
import { http, HttpResponse } from "msw";
import { mockAssets } from "./dada/mockAssets";
import { mockLedgerStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/mocks/ledgerStatus";

// Flag to simulate 500 error - set to true to test error handling
let simulate500Error = false;

// Cloudflare-like 500 error HTML page
const cloudflare500Html = `
<!DOCTYPE html>
<html>
<head>
  <title>Error 500</title>
</head>
<body>
  <div class="mb-10 md:m-0\\">\n <a href=\\"https://www.cloudflare.com/5xx-error-landing?utm_source=errorcode_500&#38;utm_campaign=target=\\"_blank\\" rel=\\"noopener noreferrer\\">
    <span class=\\"cf-icon-cloud block md:hidden h-20 bg-center bg-no-repeat\\"></span>
    <span class=\\"cf-icon-error w-12 h-12 absolute left-1/2 md:left-auto md:right-0 md:top-0 -ml-6 -bottom-4\\"></span>
  </a>
</div>
<div>
  <span class=\\"md:block w-full truncate\\">London</span>
  <h3 class=\\"md:inline-block mt-3 md:mt-0 text-2xl text-gray-600 font-light leading-1.3\\">
    <a href=\\"https://www.cloudflare.com/5xx-error-landing?utm_source=errorcode_500&utm_campaign=a target=\\"_blank\\" rel=\\"noopener noreferrer\\">Cloudflare</a>
  </h3>
  <span class=\\"leading-1.3 text-2xl text-red-error\\">Error</span>
</div>
<div id=\\"cf-host-status\\" class=\\" relative w-1/3 md:w-full py-15 md:p-0 md:py-8 md:text-left md:border-solid md:border-0 md:border-b md:border-gray-400 overflow-hidden float-left md:float-none text-center\\">
  <h2 id=\\"cf-error-details\\" class=\\"cf-error-overview-heading\\">Host Error</h2>
</div>
</body>
</html>
`;

const handlers = [
  http.get("https://dada.api.ledger-test.com/v1/assets", () => {
    // Simulate 500 error if flag is enabled
    if (simulate500Error) {
      return new HttpResponse(cloudflare500Html, {
        status: 500,
        headers: {
          "Content-Type": "text/html",
        },
      });
    }
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

// Helper function to toggle 500 error simulation
export const toggleSimulate500Error = (enable: boolean) => {
  simulate500Error = enable;
  console.log(`[MSW] 500 error simulation ${enable ? "enabled" : "disabled"}`);
};
