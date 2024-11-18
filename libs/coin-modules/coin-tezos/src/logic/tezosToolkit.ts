import { TezosToolkit } from "@taquito/taquito";
import { RpcClient, RpcClientCache } from '@taquito/rpc';
import coinConfig from "../config";

let tezos: TezosToolkit | null = null;

export function getTezosToolkit(): TezosToolkit {
  if (!tezos) {
    const rpcClient = new RpcClient(coinConfig.getCoinConfig().node.url);
    
    tezos = new TezosToolkit(new RpcClientCache(rpcClient, 30_000));
  }
  return tezos;
}
