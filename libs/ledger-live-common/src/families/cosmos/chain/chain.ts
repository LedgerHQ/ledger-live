import CosmosBase from "./cosmosBase";
import Cosmos from "./Cosmos";
import Juno from "./Juno";
import Osmosis from "./Osmosis";
import Axelar from "./Axelar";
import Desmos from "./Desmos";
import Injective from "./Injective";
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
import Evmos from "./Evmos";

const cosmosChainParams: { [key: string]: CosmosBase } = {};
export default function cryptoFactory(currencyId: string): CosmosBase {
  const initialized =
    currencyId === "osmosis" || currencyId === "osmo"
      ? cosmosChainParams["osmo"] != null
      : cosmosChainParams[currencyId] != null;
  if (!initialized) {
    switch (true) {
      case currencyId === "osmosis" || currencyId === "osmo":
        cosmosChainParams["osmo"] = new Osmosis();
        return cosmosChainParams["osmo"];
      case currencyId === "cosmos":
        cosmosChainParams[currencyId] = new Cosmos();
        break;
      case currencyId === "juno":
        cosmosChainParams[currencyId] = new Juno();
        break;
      case currencyId === "axelar":
        cosmosChainParams[currencyId] = new Axelar();
        break;
      case currencyId === "binance_beacon_chain":
        cosmosChainParams[currencyId] = new BinanceBeaconChain();
        break;
      case currencyId === "desmos":
        cosmosChainParams[currencyId] = new Desmos();
        break;
      case currencyId === "injective":
        cosmosChainParams[currencyId] = new Injective();
        break;
      case currencyId === "evmos":
        cosmosChainParams[currencyId] = new Evmos();
        break;
      case currencyId === "nyx":
        cosmosChainParams[currencyId] = new Nyx();
        break;
      case currencyId === "onomy":
        cosmosChainParams[currencyId] = new Onomy();
        break;
      case currencyId === "persistence":
        cosmosChainParams[currencyId] = new Persistence();
        break;
      case currencyId === "quicksilver":
        cosmosChainParams[currencyId] = new Quicksilver();
        break;
      case currencyId === "secret_network":
        cosmosChainParams[currencyId] = new SecretNetwork();
        break;
      case currencyId === "sei_network":
        cosmosChainParams[currencyId] = new SeiNetwork();
        break;
      case currencyId === "stargaze":
        cosmosChainParams[currencyId] = new Stargaze();
        break;
      case currencyId === "stride":
        cosmosChainParams[currencyId] = new Stride();
        break;
      case currencyId === "umee":
        cosmosChainParams[currencyId] = new Umee();
        break;
    }
  }
  if (!cosmosChainParams[currencyId]) {
    throw new Error(`${currencyId} is not supported`);
  }
  return cosmosChainParams[currencyId];

  // TODO: Currently, all cosmos currencies included setSupportedCurrencies must be supported here. We are working on a new way to support/enable new currencies
}
