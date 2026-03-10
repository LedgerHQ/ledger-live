import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { getChainAPI, type ChainAPI } from "../../../network";

export const TEST_ENDPOINT = "https://test-solana-rpc.example.com";

type RpcMethodHandler = (params: unknown[]) => unknown;

type RpcRequest = { method: string; params: unknown[]; id: string };

export function rpcHandler(methodHandlers: Record<string, RpcMethodHandler>) {
  return http.post(TEST_ENDPOINT, async ({ request }) => {
    const body = (await request.json()) as RpcRequest | RpcRequest[];

    if (Array.isArray(body)) {
      return HttpResponse.json(
        body.map(req => {
          const handler = methodHandlers[req.method];
          if (!handler) {
            return {
              jsonrpc: "2.0",
              error: { code: -32601, message: `Method not found: ${req.method}` },
              id: req.id,
            };
          }
          return { jsonrpc: "2.0", result: handler(req.params), id: req.id };
        }),
      );
    }

    const handler = methodHandlers[body.method];
    if (!handler) {
      return HttpResponse.json(
        {
          jsonrpc: "2.0",
          error: { code: -32601, message: `Method not found: ${body.method}` },
          id: body.id,
        },
        { status: 200 },
      );
    }
    return HttpResponse.json({ jsonrpc: "2.0", result: handler(body.params), id: body.id });
  });
}

export const server = setupServer();

export function createTestChainApi(): ChainAPI {
  return getChainAPI({ endpoint: TEST_ENDPOINT });
}
