import { TezosToolkit } from "@taquito/taquito";
import coinConfig from "../config";

let tezos: TezosToolkit | null = null;

export function getTezosToolkit(): TezosToolkit {
  if (!tezos) {
    tezos = new TezosToolkit(coinConfig.getCoinConfig().node.url);
  }
  return tezos;
}
