import { ApiPromise, HttpProvider, WsProvider } from "@polkadot/api";
import { getCoinConfig, PolkadotCoinConfig } from "../../config";

let coinConfig: PolkadotCoinConfig | undefined;
let api: ApiPromise | undefined;

export default async function () {
  const config = getCoinConfig();
  // Need to constantly check if a new config is setted
  if (!api || coinConfig !== config) {
    coinConfig = config;
    const headers = coinConfig.node.credentials
      ? { Authorization: "Basic " + coinConfig.node.credentials }
      : undefined;

    const nodeURL = coinConfig.node.url;

    if (nodeURL.startsWith("ws://") || nodeURL.startsWith("wss://")) {
      api = await ApiPromise.create({
        provider: new WsProvider(nodeURL),
        noInitWarn: true,
      });
    } else if (nodeURL.startsWith("http://") || nodeURL.startsWith("https://")) {
      api = await ApiPromise.create({
        provider: new HttpProvider(coinConfig.node.url, headers),
        noInitWarn: true, //to avoid undesired warning (ex: "API/INIT: polkadot/1002000: Not decorating unknown runtime apis")
      });
    } else {
      throw new Error("[Polkadot] Invalid node URL");
    }
  }

  return api;
}
