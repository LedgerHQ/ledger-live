import { setupServer } from "msw/node";
import { http, HttpResponse, bypass } from "msw";
import { ExplorerExtrinsic } from "@ledgerhq/coin-polkadot";

const explorerAppendixByAddress = new Map<string, ExplorerExtrinsic[]>();

export function indexOperation(address: string, extrinsic: ExplorerExtrinsic) {
  const indexedOperations = explorerAppendixByAddress.get(address);
  if (indexedOperations) {
    explorerAppendixByAddress.set(address, [...indexedOperations, extrinsic]);
  } else {
    explorerAppendixByAddress.set(address, [extrinsic]);
  }
}

const handlers = [
  http.get("*/accounts/*/operations", async ({ request, params }) => {
    const address = params["1"] as string;
    const response = await fetch(bypass(request)).then(res => res.json());
    const opsMap = explorerAppendixByAddress.get(address);

    if (opsMap) {
      response.extrinsics.push(...opsMap);
    }

    return HttpResponse.json(response);
  }),
  // Override the active era to be able to withdraw unbonded funds
  http.get("*/pallets/staking/storage/activeEra", async ({ request }) => {
    const response = await fetch(bypass(request)).then(res => res.json());
    const activaEraDate = new Date();
    activaEraDate.setDate(activaEraDate.getDate()); // we update the active era to + 29 days so that we can withdraw unbonded funds
    response.value.start = activaEraDate.getTime();
    response.value.index = Number(response.value.index) + 29;

    return HttpResponse.json(response);
  }),
];

const server = setupServer(...handlers);
server.listen({ onUnhandledRequest: "bypass" });
