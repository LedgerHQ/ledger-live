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

type ExplorerOperations = {
  status: number;
  extrinsics: ExplorerExtrinsic[];
};

const explorerAppendixByAddress = new Map<string, ExplorerOperations>();

export function indexOperation(
  address: string,
  operation: { status: number; extrinsic: ExplorerExtrinsic },
) {
  const indexedOperations = explorerAppendixByAddress.get(address);
  if (indexedOperations) {
    explorerAppendixByAddress.set(address, {
      status: indexedOperations.status,
      extrinsics: [...indexedOperations.extrinsics, operation.extrinsic],
    });
  }
}

const handlers = [
  http.get("*/blockchain/v4/*/address/*/txs", async ({ request, params }) => {
    const address = params["2"] as string;
    const response = await fetch(bypass(request)).then(res => res.json());
    const opsMap = explorerAppendixByAddress.get(address || "");
    console.log(response);

    return HttpResponse.json({ data: opsMap });
  }),
];

const server = setupServer(...handlers);
server.listen({ onUnhandledRequest: "bypass" });
