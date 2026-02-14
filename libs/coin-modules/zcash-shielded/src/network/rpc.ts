import network from "@ledgerhq/live-network";
import type { GetBlockRpcResponse, ZCashBlock } from "./types";

const JSON_RPC_ID = "ledger";

export type JsonRpcResponse<T> = {
  result?: T;
  error?: { code: number; message: string };
};

function mapRpcBlockToBlock(rpc: GetBlockRpcResponse): ZCashBlock {
  return {
    height: rpc.height,
    time: rpc.time,
    hash: rpc.hash,
  };
}

/**
 * Zcash node RPC client using getblock and getblockcount.
 * Uses @ledgerhq/live-network for HTTP.
 */
export class ZCashRpcClient {
  constructor(private readonly nodeUrl: string) {}

  async getBlockCount(): Promise<number> {
    const response = await this.rpcCall<number>("getblockcount", []);
    if (typeof response !== "number") {
      throw new Error(`getblockcount returned unexpected type: ${typeof response}`);
    }
    return response;
  }

  async getBlockByHeight(height: number): Promise<ZCashBlock> {
    const response = await this.rpcCall<GetBlockRpcResponse>("getblock", [height.toString()]);
    if (
      !response ||
      typeof response !== "object" ||
      typeof response.height !== "number" ||
      typeof response.time !== "number" ||
      typeof response.hash !== "string"
    ) {
      throw new Error("getblock returned invalid block");
    }
    return mapRpcBlockToBlock(response);
  }

  private async rpcCall<T>(method: string, params: unknown[]): Promise<T> {
    const { data } = await network<JsonRpcResponse<T>>({
      method: "POST",
      url: this.nodeUrl,
      data: {
        jsonrpc: "1.0",
        id: JSON_RPC_ID,
        method,
        params,
      },
    });

    if (data.error) {
      throw new Error(`Zcash RPC ${method} failed: ${data.error.message}`);
    }

    if (data.result === undefined) {
      throw new Error(`Zcash RPC ${method} returned no result`);
    }

    return data.result;
  }
}
