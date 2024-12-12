import CosmosBase from "./cosmosBase";
import Cosmos from "./Cosmos";
import Osmosis from "./Osmosis";
import Axelar from "./Axelar";
import Desmos from "./Desmos";
import Nyx from "./Nyx";
import Onomy from "./Onomy";
import Persistence from "./Persistence";
import Quicksilver from "./Quicksilver";
import SecretNetwork from "./SecretNetwork";
import SeiNetwork from "./SeiNetwork";
import Stargaze from "./Stargaze";
import Stride from "./Stride";
import Umee from "./Umee";
import BinanceBeaconChain from "./BinanceBeaconChain";
import Coreum from "./Coreum";
import Injective from "./Injective";
import Dydx from "./Dydx";
import Mantra from "./Mantra";
import CryptoOrg from "./CryptoOrg";

const cosmosChainParams: { [key: string]: CosmosBase } = {};
export default function cryptoFactory(currencyId: string): CosmosBase {
  currencyId = currencyId === "osmosis" ? "osmo" : currencyId;
  const initialized = cosmosChainParams[currencyId] != null;
  if (!initialized) {
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
      case "sei_network":
        cosmosChainParams[currencyId] = new SeiNetwork();
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
      case "crypto_org_cosmos":
        cosmosChainParams[currencyId] = new CryptoOrg();
        break;
      default:
        throw new Error(`${currencyId} is not supported`);
    }
  }
  return cosmosChainParams[currencyId];

  // TODO: Currently, all cosmos currencies included setSupportedCurrencies must be supported here. We are working on a new way to support/enable new currencies
}
