import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/lib/currencies";
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
import Onomy from "./Onomy";
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
    switch (currencyId) {
      case "osmo":
        cosmosChainParams[currencyId] = new Osmosis();
        break;
      case "cosmos":
        cosmosChainParams[currencyId] = new Cosmos();
        break;
      case "axelar":
        cosmosChainParams[currencyId] = new Axelar();
        break;
      case "binance_beacon_chain":
        cosmosChainParams[currencyId] = new BinanceBeaconChain();
        break;
      case "desmos":
        cosmosChainParams[currencyId] = new Desmos();
        break;
      case "dydx":
        cosmosChainParams[currencyId] = new Dydx();
        break;
      case "nyx":
        cosmosChainParams[currencyId] = new Nyx();
        break;
      case "onomy":
        cosmosChainParams[currencyId] = new Onomy();
        break;
      case "persistence":
        cosmosChainParams[currencyId] = new Persistence();
        break;
      case "quicksilver":
        cosmosChainParams[currencyId] = new Quicksilver();
        break;
      case "secret_network":
        cosmosChainParams[currencyId] = new SecretNetwork();
        break;
      case "stargaze":
        cosmosChainParams[currencyId] = new Stargaze();
        break;
      case "stride":
        cosmosChainParams[currencyId] = new Stride();
        break;
      case "umee":
        cosmosChainParams[currencyId] = new Umee();
        break;
      case "coreum":
        cosmosChainParams[currencyId] = new Coreum();
        break;
      case "injective":
        cosmosChainParams[currencyId] = new Injective();
        break;
      case "mantra":
        cosmosChainParams[currencyId] = new Mantra();
        break;
      case "crypto_org":
        cosmosChainParams[currencyId] = new CryptoOrg();
        break;
      case "xion":
        cosmosChainParams[currencyId] = new Xion();
        break;
      case "zenrock":
        cosmosChainParams[currencyId] = new Zenrock();
        break;
      case "babylon":
        cosmosChainParams[currencyId] = new Babylon();
        break;
      default:
        throw new Error(`${currencyId} is not supported`);
    }

    const coinConfig = cosmosCoinConfig.getCoinConfig(getCryptoCurrencyById(currencyId));
    if (coinConfig) {
      cosmosChainParams[currencyId] = { ...cosmosChainParams[currencyId], ...coinConfig };
    }
  }

  return cosmosChainParams[currencyId];

  // TODO: Currently, all cosmos currencies included setSupportedCurrencies must be supported here. We are working on a new way to support/enable new currencies
}
