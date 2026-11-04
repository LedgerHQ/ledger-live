import { http, HttpResponse } from "msw";
import { readOnlyConfigStorage } from "@shared/app-config";
import { loadAppConfig } from "~/setup/load";

// `useLedgerSyncInfo` (mounted by the WalletSync Manage screen) calls `GET /_info` on the
// trustchain and cloud-sync backends. The store resolves them from the `ledgerKeyRing` switch,
// so stub the hosts of both options to keep tests offline.
const STATUS = { name: "ledger-sync", version: "1.0.0" };

const noSelections = {
  selections: readOnlyConfigStorage(() => ({})),
  devValues: readOnlyConfigStorage(() => ({})),
};

const baseUrls = (["staging", "prod"] as const).flatMap(profile => {
  const { trustchainApiBaseUrl, cloudSyncApiBaseUrl } = loadAppConfig(noSelections, profile).config;
  return [trustchainApiBaseUrl, cloudSyncApiBaseUrl];
});

export default [...new Set(baseUrls)].map(baseUrl =>
  http.get(`${baseUrl}/_info`, () => HttpResponse.json(STATUS)),
);
