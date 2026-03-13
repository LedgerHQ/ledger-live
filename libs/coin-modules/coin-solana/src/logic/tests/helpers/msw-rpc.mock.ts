/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { BlockhashWithExpiryBlockHeight, TransactionSignature } from "@solana/web3.js";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { getChainAPI, type ChainAPI } from "../../../network";

export const TEST_ENDPOINT = "https://test-solana-rpc.example.com";

type RpcMethodHandler = (params: unknown[]) => unknown;

type RpcRequest = { method: string; params: unknown[]; id: string | number | null };

function invokeHandler(
  handler: RpcMethodHandler | undefined,
  method: string,
  params: unknown[],
  id: string | number | null,
) {
  if (!handler) {
    return {
      jsonrpc: "2.0" as const,
      error: { code: -32601, message: `Method not found: ${method}` },
      id,
    };
  }
  try {
    return { jsonrpc: "2.0" as const, result: handler(params), id };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      jsonrpc: "2.0" as const,
      error: { code: -32603, message },
      id,
    };
  }
}

export function rpcHandler(methodHandlers: Record<string, RpcMethodHandler>) {
  return http.post(TEST_ENDPOINT, async ({ request }) => {
    const body = (await request.json()) as RpcRequest | RpcRequest[];

    if (Array.isArray(body)) {
      return HttpResponse.json(
        body.map(req => invokeHandler(methodHandlers[req.method], req.method, req.params, req.id)),
      );
    }

    return HttpResponse.json(
      invokeHandler(methodHandlers[body.method], body.method, body.params, body.id),
    );
  });
}

export const server = setupServer();

async function fetchRpc(method: string, params: unknown[]): Promise<unknown> {
  const response = await fetch(TEST_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = (await response.json()) as
    | { result: unknown; error?: undefined }
    | { result?: undefined; error: { code: number; message: string } };
  if ("error" in json && json.error) {
    throw new Error(json.error.message);
  }
  return json.result;
}

export function createTestChainApi(): ChainAPI {
  const realApi = getChainAPI({ endpoint: TEST_ENDPOINT });
  return {
    ...realApi,
    sendRawTransaction: async (
      buffer: Buffer,
      recentBlockhash?: BlockhashWithExpiryBlockHeight,
    ) => {
      const txBase64 = buffer.toString("base64");
      const signature = (await fetchRpc("sendTransaction", [txBase64])) as string;

      if (!recentBlockhash) {
        const res = (await fetchRpc("getLatestBlockhash", ["confirmed"])) as {
          value: BlockhashWithExpiryBlockHeight;
        };
        recentBlockhash = res.value;
      }

      const blockHeight = (await fetchRpc("getBlockHeight", [])) as number;
      if (blockHeight > recentBlockhash.lastValidBlockHeight) {
        throw new Error(
          `TransactionExpiredBlockheightExceededError: block height exceeded – ` +
            `current: ${blockHeight}, lastValid: ${recentBlockhash.lastValidBlockHeight}`,
        );
      }

      return signature as unknown as TransactionSignature;
    },
  };
}
