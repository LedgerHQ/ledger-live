import { http, HttpResponse } from "msw";
import { mockedResponse } from "./fixtures/nfts";

const handlers = [
  http.post("https://nft.api.live.ledger.com/v1/ethereum/1/contracts/tokens/infos", () => {
    return HttpResponse.json(mockedResponse.tokenInfos1);
  }),
  http.get(
    "https://simplehash.api.live.ledger.com/api/v0/nfts/owners_v2?chains=ethereum&wallet_addresses=0x833eBB4bDa11da33a7F1C907C8171e5995Fe33c7&limit=50&filters=spam_score__lte=75",
    () => {
      return HttpResponse.json(mockedResponse.simplehash);
    },
  ),
];

export default handlers;
