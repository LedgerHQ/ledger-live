import { TezosToolkit } from "@taquito/taquito";
import coinConfig from "../config";

export function getTezosToolkit(): TezosToolkit {
  return new TezosToolkit(coinConfig.getCoinConfig().node.url);
}
