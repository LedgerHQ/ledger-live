import network from '@ledgerhq/live-network';
import { log } from "@ledgerhq/logs";
import { LOG_TYPE } from "./consts";

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
  confirmations: number;
  size: number;
  height: number;
  version: number;
  merkleroot: string;
  blockcommitments: string;
  finalsaplingroot: string;
  finalorchardroot: string;
  tx: string[];
  time: number;
  nonce: string;
  solution: string;
  bits: string;
  difficulty: number;
  chainSupply: {
    chainValue: number;
    chainValueZat: number;
    monitored: true;
  };
  valuePools: object[];
  trees: { sapling: object; orchard: object };
  previousblockhash: string;
  nextblockhash: string;
};

export type RawTransaction = {
  in_active_chain: boolean;
  hex: string;
  height: number;
  confirmations: number;
  vin: [
    {
      coinbase: string;
      sequence: number;
    },
  ];
  vout: [
    {
      value: number;
      valueZat: number;
      n: number;
      scriptPubKey: {
        asm: string;
        hex: string;
        reqSigs: number;
        type: string;
        addresses: string[];
      };
    },
    {
      value: number;
      valueZat: number;
      n: number;
      scriptPubKey: {
        asm: string;
        hex: string;
        reqSigs: number;
        type: string;
        addresses: string[];
      };
    },
  ];
  vShieldedSpend: [];
  vShieldedOutput: [];
  vjoinsplit: [];
  orchard: {
    actions: [];
    valueBalance: number;
    valueBalanceZat: number;
  };
  valueBalance: number;
  valueBalanceZat: number;
  size: number;
  time: number;
  txid: string;
  authdigest: string;
  overwintered: true;
  version: number;
  versiongroupid: string;
  locktime: number;
  expiryheight: number;
  blockhash: string;
  blocktime: number;
};

export class JsonRpcClient {
  serverUrl: string;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  private async jsonRpcRequest<ResponseResult extends object>(
    args: JsonRpcRequestArgs,
  ): Promise<ResponseResult | undefined> {
    const { data } = await network<JsonRpcResponseOk<ResponseResult> & JsonRpcResponseError>({
      url: this.serverUrl,
      method: "POST",
      data: {
        jsonrpc: "2.0",
        ...args,
        id: 1,
      },
    });

    if (data.error || !data.result) {
      log(LOG_TYPE, `error: Empty dataonse result from server - ${data?.error?.message}`);
    } else {
      return data.result;
    }
  }

  getBlock(blockHash: string) {
    return this.jsonRpcRequest<Block>({
      method: "getblock",
      params: [blockHash, 1],
    });
  }

  getRawTransaction(txId: string) {
    return this.jsonRpcRequest<RawTransaction>({
      method: "getrawtransaction",
      params: [txId, 1],
    });
  }
}
