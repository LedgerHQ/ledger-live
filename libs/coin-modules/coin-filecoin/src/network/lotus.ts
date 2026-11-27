import network from "@ledgerhq/live-network";

type LotusTipSet = { Height: number };

type JsonRpcError = { code: number; message: string };

type JsonRpcResponse<T> = { result: T; error?: never } | { result?: never; error: JsonRpcError };

async function callLotus<T>(nodeUrl: string, method: string, params: unknown[]): Promise<T> {
  const { data } = await network<JsonRpcResponse<T>>({
    method: "POST",
    url: nodeUrl,
    data: { jsonrpc: "2.0", id: 1, method, params },
  });
  if (data.error) {
    throw new Error(`Lotus ${method} failed: ${data.error.message} (code ${data.error.code})`);
  }
  return data.result as T;
}

/** The height of the tipset that F3 (or EC when F3 is down) finalized: the chain up to it cannot change. */
export async function fetchFinalizedHeight(nodeUrl: string): Promise<number> {
  const tipSet = await callLotus<LotusTipSet>(nodeUrl, "Filecoin.ChainGetTipSet", [
    { tag: "finalized" },
  ]);
  return tipSet.Height;
}
