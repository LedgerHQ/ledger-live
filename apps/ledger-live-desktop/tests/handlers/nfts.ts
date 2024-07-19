import { http, HttpResponse } from "msw";
import MockedResponse from "./mockedResponse.json";

const handlers = [
  http.get("https://nft.api.live.ledger.com/v1/ethereum/1/contracts/infos", () => {
    return HttpResponse.json({ MockedResponse });
  }),
  http.get("https://simplehash.api.live.ledger.com/api/v0/nfts/owners_v2", () => {
    return HttpResponse.json({ MockedResponse });
  }),
];

export default handlers;
