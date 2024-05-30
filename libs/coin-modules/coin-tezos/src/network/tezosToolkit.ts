import { TezosToolkit } from "@taquito/taquito";
import coinConfig from "../config";

const tezos = new TezosToolkit(coinConfig.getCoinConfig().node.url);

export default tezos;
