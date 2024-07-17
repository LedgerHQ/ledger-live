import { http, HttpResponse } from "msw";
import MockedResponse from "./mockedResponse.json";

const handlers = [
  http.get("https://simplehash.api.live.ledger.com/api/v0/nfts/owners_v2", () => {
    return HttpResponse.json({ MockedResponse }, { status: 200 });
  }),
];

export default handlers;
