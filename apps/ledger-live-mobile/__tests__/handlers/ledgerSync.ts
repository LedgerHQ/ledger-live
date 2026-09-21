import { http, HttpResponse } from "msw";
import AuthenticateJson from "../../__mocks__/api/LedgerSync/authenticate.json";
import ChallengeJson from "../../__mocks__/api/LedgerSync/challenge.json";
import InfoJson from "../../__mocks__/api/LedgerSync/info.json";
import v1Json from "../../__mocks__/api/LedgerSync/v1.json";
import { getWalletSyncEnvironmentParams } from "@features/platform-wallet-sync";

const handlers = (["STAGING", "PROD"] as const).flatMap(environment => {
  const { trustchainApiBaseUrl, cloudSyncApiBaseUrl } =
    getWalletSyncEnvironmentParams(environment);

  return [
    http.post(`${trustchainApiBaseUrl}/v1/authenticate`, () => HttpResponse.json(AuthenticateJson)),
    http.get(`${trustchainApiBaseUrl}/v1/challenge`, () => HttpResponse.json(ChallengeJson)),
    http.get(`${cloudSyncApiBaseUrl}/_info`, () => HttpResponse.json(InfoJson)),
    http.get(`${trustchainApiBaseUrl}/_info`, () => HttpResponse.json(InfoJson)),
    http.get(
      `${trustchainApiBaseUrl}/v1/trustchain/000c9ec1a1ab774f7eaeff2b0d4ad695f1fa07ea28d33f5d34126cb1152d6d83f6`,
      () => {
        return HttpResponse.json(v1Json);
      },
    ),
  ];
});

export default handlers;
