import { ApiPromise, HttpProvider, WsProvider } from "@polkadot/api";
import { type ProviderInterface } from "@polkadot/rpc-provider/types";
import { type PolkadotCoinConfig } from "../../config";

const MAX_CONNECTIONS = 8;

type Connection = { credentials: string; api: Promise<ApiPromise> };

const connections = new Map<string, Connection>();

const connect = async (config: PolkadotCoinConfig): Promise<ApiPromise> => {
  const headers = config.node.credentials
    ? { Authorization: "Basic " + config.node.credentials }
    : undefined;

  const nodeURL = config.node.url;

  let provider: HttpProvider | WsProvider;

  if (nodeURL.startsWith("ws://") || nodeURL.startsWith("wss://")) {
    provider = new WsProvider(nodeURL);
  } else if (nodeURL.startsWith("http://") || nodeURL.startsWith("https://")) {
    provider = new HttpProvider(nodeURL, headers);
  } else {
    throw new Error("[Polkadot] Invalid node URL");
  }

  return ApiPromise.create({
    provider: provider as ProviderInterface,
    noInitWarn: true, //to avoid undesired warning (ex: "API/INIT: polkadot/1002000: Not decorating unknown runtime apis")
  });
};

const disconnect = (connection: Connection): void => {
  connection.api.then(api => api.disconnect()).catch(() => undefined);
};

export default async function (config: PolkadotCoinConfig): Promise<ApiPromise> {
  const url = config.node.url;
  const credentials = config.node.credentials ?? "";
  const existing = connections.get(url);
  if (existing?.credentials === credentials) {
    connections.delete(url);
    connections.set(url, existing);
    return existing.api;
  }
  if (existing) {
    connections.delete(url);
    disconnect(existing);
  }
  const connection: Connection = { credentials, api: connect(config) };
  connections.set(url, connection);
  connection.api.catch(() => {
    if (connections.get(url) === connection) {
      connections.delete(url);
    }
  });
  for (const [oldestUrl, oldest] of connections) {
    if (connections.size <= MAX_CONNECTIONS) {
      break;
    }
    connections.delete(oldestUrl);
    disconnect(oldest);
  }
  return connection.api;
}
