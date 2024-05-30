import { setupServer } from "msw/node";
import { http, HttpResponse, bypass } from "msw";

type ExplorerExtrinsic = {
  blockNumber: number;
  timestamp: number;
  nonce: number;
  hash: string;
  signer: string;
  affectedAddress1: string;
  affectedAddress2?: string;
  method: string;
  section: string;
  index: number;
  isSuccess: boolean;
  amount: number;
  partialFee: number;
  isBatch: boolean;
};

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
