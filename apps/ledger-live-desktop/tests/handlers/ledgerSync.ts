import { http, HttpResponse } from "msw";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";

// `useLedgerSyncInfo` (mounted by the WalletSync Manage screen) calls `GET /_info` on the
// trustchain and cloud-sync backends. A test can select either backend in the app config, so
// stub both STAGING and PROD hosts to keep tests offline.
const STATUS = { name: "ledger-sync", version: "1.0.0" };

const baseUrls = (["STAGING", "PROD"] as const).flatMap(env => {
  const { trustchainApiBaseUrl, cloudSyncApiBaseUrl } = getWalletSyncEnvironmentParams(env);
  return [trustchainApiBaseUrl, cloudSyncApiBaseUrl];
});

export default [...new Set(baseUrls)].map(baseUrl =>
  http.get(`${baseUrl}/_info`, () => HttpResponse.json(STATUS)),
);
