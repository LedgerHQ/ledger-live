import network from "@ledgerhq/live-network";
import { log } from "@ledgerhq/logs";
import { ZCASH_LOG_TYPE } from "./constants";

type JsonRpcRequestArgs = {
  method: string;
  params: unknown[];
};

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: string;
};

type JsonRpcResponseOk<T> = JsonRpcResponse & {
  result: T;
};

type JsonRpcResponseError = JsonRpcResponse & {
  error: {
    code: number;
    message: string;
  };
};

export type Block = {
  hash: string;
  confirmations?: number;
  size?: number;
  height: number;
  version?: number;
  merkleroot?: string;
  blockcommitments?: string;
  finalsaplingroot?: string;
  finalorchardroot?: string;
  tx: string[];
  time: number;
  nonce?: string;
  solution?: string;
  bits?: string;
  difficulty?: number;
  chainSupply?: {
    chainValue: number;
    chainValueZat: number;
    monitored: true;
  };
  valuePools?: object[];
  trees?: { sapling: object; orchard: object };
  previousblockhash?: string;
  nextblockhash?: string;
};

export type RawTransaction = {
  in_active_chain?: boolean;
  hex: string;
  height: number;
  confirmations?: number;
  vin?: {
    coinbase: string;
    sequence: number;
  }[];
  vout?: {
    value?: number;
    valueZat: number;
    n?: number;
    scriptPubKey?: {
      asm: string;
      hex: string;
      reqSigs: number;
      type: string;
      addresses: string[];
    };
  }[];
  vShieldedSpend?: [];
  vShieldedOutput?: [];
  vjoinsplit?: [];
  orchard: {
    actions: object[];
    valueBalance: number;
    valueBalanceZat: number;
  };
  valueBalance?: number;
  valueBalanceZat?: number;
  size?: number;
  time: number;
  txid: string;
  authdigest?: string;
  overwintered?: true;
  version?: number;
  versiongroupid?: string;
  locktime?: number;
  expiryheight?: number;
  blockhash: string;
  blocktime?: number;
};

type JsonRpcResponseData<T> = JsonRpcResponseOk<T> | JsonRpcResponseError;

export class JsonRpcClient {
  serverUrl: string;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  async _jsonRpcRequest<ResponseResult>(
    args: JsonRpcRequestArgs,
  ): Promise<ResponseResult | undefined> {
    let data: JsonRpcResponseData<ResponseResult>;

    try {
      const response = await network<JsonRpcResponseData<ResponseResult>>({
        url: this.serverUrl,
        method: "POST",
        data: {
          jsonrpc: "2.0",
          ...args,
          id: 1,
        },
      });

      data = response.data;
    } catch (err) {
      log(ZCASH_LOG_TYPE, "error: Network error");
      throw err;
    }

    if ("error" in data) {
      const message = data.error.message ?? "unknown error";
      log(ZCASH_LOG_TYPE, `error: Zcash RPC ${args.method} failed - ${message}`);
    } else if (data.result === undefined || data.result === null) {
      log(ZCASH_LOG_TYPE, `error: Zcash RPC ${args.method} returned no result`);
    } else {
      return data.result;
    }
  }

  getBlock(blockHashOrHeight: string) {
    return this._jsonRpcRequest<Block>({
      method: "getblock",
      params: [blockHashOrHeight, 1],
    });
  }

  async getBlockCount(): Promise<number | undefined> {
    const result = await this._jsonRpcRequest<number>({
      method: "getblockcount",
      params: [],
    });

    if (result === undefined) {
      return undefined;
    }

    if (typeof result !== "number") {
      log(ZCASH_LOG_TYPE, "error: Zcash RPC getblockcount returned non-numeric result");
      return undefined;
    }

    return result;
  }

  getRawTransaction(txId: string) {
    return this._jsonRpcRequest<RawTransaction>({
      method: "getrawtransaction",
      params: [txId, 1],
    });
  }
}
