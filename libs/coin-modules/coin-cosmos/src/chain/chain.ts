import cosmosCoinConfig from "../config";
import Axelar from "./Axelar";
import Babylon from "./Babylon";
import BinanceBeaconChain from "./BinanceBeaconChain";
import Coreum from "./Coreum";
import Cosmos from "./Cosmos";
import CryptoOrg from "./CryptoOrg";
import Desmos from "./Desmos";
import Dydx from "./Dydx";
import Injective from "./Injective";
import Mantra from "./Mantra";
import Nyx from "./Nyx";
import Osmosis from "./Osmosis";
import Persistence from "./Persistence";
import Quicksilver from "./Quicksilver";
import SecretNetwork from "./SecretNetwork";
import Stargaze from "./Stargaze";
import Stride from "./Stride";
import Umee from "./Umee";
import Xion from "./Xion";
import Zenrock from "./Zenrock";
import CosmosBase from "./cosmosBase";

const cosmosChainParams: { [key: string]: CosmosBase } = {};
export default function cryptoFactory(currencyId: string): CosmosBase {
  currencyId = currencyId === "osmosis" ? "osmo" : currencyId;
  if (!cosmosChainParams[currencyId]) {
    let chain: CosmosBase;
    switch (currencyId) {
      case "osmo":
        chain = new Osmosis();
        break;
      case "cosmos":
        chain = new Cosmos();
        break;
      case "axelar":
        chain = new Axelar();
        break;
      case "binance_beacon_chain":
        chain = new BinanceBeaconChain();
        break;
      case "desmos":
        chain = new Desmos();
        break;
      case "dydx":
        chain = new Dydx();
        break;
      case "nyx":
        chain = new Nyx();
        break;
      case "persistence":
        chain = new Persistence();
        break;
      case "quicksilver":
        chain = new Quicksilver();
        break;
      case "secret_network":
        chain = new SecretNetwork();
        break;
      case "stargaze":
        chain = new Stargaze();
        break;
      case "stride":
        chain = new Stride();
        break;
      case "umee":
        chain = new Umee();
        break;
      case "coreum":
        chain = new Coreum();
        break;
      case "injective":
        chain = new Injective();
        break;
      case "mantra":
        chain = new Mantra();
        break;
      case "crypto_org":
        chain = new CryptoOrg();
        break;
      case "xion":
        chain = new Xion();
        break;
      case "zenrock":
        chain = new Zenrock();
        break;
      case "babylon":
        chain = new Babylon();
        break;
      default:
        throw new Error(`${currencyId} is not supported`);
    }

    try {
      const coinConfig = cosmosCoinConfig.getCoinConfig(currencyId);
      cosmosChainParams[currencyId] = coinConfig
        ? ({ ...chain, ...coinConfig } as CosmosBase)
        : chain;
    } catch {
      // coinConfig not yet initialized (bridges not loaded) — return defaults without caching
      // so enrichment is retried on the next call once bridges are set up
      return chain;
    }
  }

  return cosmosChainParams[currencyId];

  // TODO: Currently, all cosmos currencies included setSupportedCurrencies must be supported here. We are working on a new way to support/enable new currencies
}
