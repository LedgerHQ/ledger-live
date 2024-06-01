import { setupServer } from "msw/node";
import { http, HttpResponse, bypass } from "msw";
import { ExplorerExtrinsic } from "../../types";

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
];

const server = setupServer(...handlers);
server.listen({ onUnhandledRequest: "bypass" });
