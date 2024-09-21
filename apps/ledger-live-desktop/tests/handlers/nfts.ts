/* eslint-disable @typescript-eslint/no-unused-vars */
import { http, HttpResponse } from "msw";
import { ETHmockedResponse } from "./fixtures/nfts";
import { OrdinalsMockedResponse } from "./fixtures/ordinals";

const handlers = [
  http.post("https://nft.api.live.ledger.com/v1/ethereum/1/contracts/tokens/infos", () => {
    return HttpResponse.json(ETHmockedResponse.tokenInfos1);
  }),
  http.get("https://simplehash.api.live.ledger.com/api/v0/nfts/owners_v2", ({ request }) => {
    const url = new URL(request.url);
    const chains = url.searchParams.get("chains");
    const walletAddresses = url.searchParams.get("wallet_addresses");
    const limit = url.searchParams.get("limit");
    const filters = url.searchParams.get("filters");

    if (chains === "bitcoin,utxo" && walletAddresses)
      return HttpResponse.json(OrdinalsMockedResponse.mockedResponse1);

    if (chains === "ethereum" && walletAddresses)
      return HttpResponse.json(ETHmockedResponse.simplehash);
  }),
];

export default handlers;
