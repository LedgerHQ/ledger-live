import { http, HttpResponse } from "msw";
import AuthenticateJson from "../../__mocks__/api/LedgerSync/authenticate.json";
import ChallengeJson from "../../__mocks__/api/LedgerSync/challenge.json";
import InfoJson from "../../__mocks__/api/LedgerSync/info.json";
import v1Json from "../../__mocks__/api/LedgerSync/v1.json";
const handlers = [
  http.post("https://trustchain-backend.api.aws.stg.ldg-tech.com/v1/authenticate", () => {
    return HttpResponse.json(AuthenticateJson);
  }),
  http.get("https://trustchain-backend.api.aws.stg.ldg-tech.com/v1/challenge", () => {
    return HttpResponse.json(ChallengeJson);
  }),
  http.get("https://cloud-sync-backend.api.aws.stg.ldg-tech.com/_info", () => {
    return HttpResponse.json(InfoJson);
  }),
  http.get("https://trustchain-backend.api.aws.stg.ldg-tech.com/_info", () => {
    return HttpResponse.json(InfoJson);
  }),
  http.get(
    "https://trustchain-backend.api.aws.stg.ldg-tech.com/v1/trustchain/000c9ec1a1ab774f7eaeff2b0d4ad695f1fa07ea28d33f5d34126cb1152d6d83f6",
    () => {
      return HttpResponse.json(v1Json);
    },
  ),
];

export default handlers;
