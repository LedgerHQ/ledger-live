import { TezosToolkit } from "@taquito/taquito";
import coinConfig from "../config";

// Tezos client instance is cached to avoid costly rebuild at every request
// Watch out: cache key is the URL, coin module can be instantiated several times with different URLs
const servers = new Map<string, TezosToolkit>();
export function getTezosToolkit(): TezosToolkit {
  const url = coinConfig.getCoinConfig().node.url;
  let server = servers.get(url);
  if (server === undefined) {
    server = new TezosToolkit(url);
    servers.set(url, server);
  }
  return server;
}
