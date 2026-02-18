import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { ApiPromise, HttpProvider, WsProvider } from "@polkadot/api";
import polkadotCoinConfig, { type PolkadotCoinConfig } from "../../config";

let coinConfig: PolkadotCoinConfig | undefined;
let api: ApiPromise | undefined;

export default async function (currency?: CryptoCurrency) {
  const config = polkadotCoinConfig.getCoinConfig(currency);
  // Need to constantly check if a new config is setted
  if (!api || coinConfig !== config) {
    coinConfig = config;
    const headers = coinConfig.node.credentials
      ? { Authorization: "Basic " + coinConfig.node.credentials }
      : undefined;

    const nodeURL = coinConfig.node.url;

    let provider: HttpProvider | WsProvider;

    if (nodeURL.startsWith("ws://") || nodeURL.startsWith("wss://")) {
      provider = new WsProvider(nodeURL);
    } else if (nodeURL.startsWith("http://") || nodeURL.startsWith("https://")) {
      provider = new HttpProvider(nodeURL, headers);
    } else {
      throw new Error("[Polkadot] Invalid node URL");
    }

    api = await ApiPromise.create({
      provider,
      noInitWarn: true, //to avoid undesired warning (ex: "API/INIT: polkadot/1002000: Not decorating unknown runtime apis")
    });
  }

  return api;
}
