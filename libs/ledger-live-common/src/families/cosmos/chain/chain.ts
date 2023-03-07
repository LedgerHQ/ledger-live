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

const cosmosChainParams: { [key: string]: CosmosBase } = {};
export default function cryptoFactory(currencyId: string): CosmosBase {
  if (currencyId === "osmosis" || currencyId === "osmo") {
    if (!cosmosChainParams["osmo"]) {
      cosmosChainParams["osmo"] = new Osmosis();
    }
    return cosmosChainParams["osmo"];
  } else if (currencyId === "cosmos") {
    if (!cosmosChainParams[currencyId]) {
      cosmosChainParams[currencyId] = new Cosmos();
    }
    return cosmosChainParams[currencyId];
  } else if (currencyId === "juno") {
    if (!cosmosChainParams[currencyId]) {
      cosmosChainParams[currencyId] = new Juno();
    }
    return cosmosChainParams[currencyId];
  } else if (currencyId === "axelar") {
    if (!cosmosChainParams[currencyId]) {
      cosmosChainParams[currencyId] = new Axelar();
    }
    return cosmosChainParams[currencyId];
  } else if (currencyId === "binance_beacon_chain") {
    if (!cosmosChainParams[currencyId]) {
      cosmosChainParams[currencyId] = new BinanceBeaconChain();
    }
    return cosmosChainParams[currencyId];
  } else if (currencyId === "desmos") {
    if (!cosmosChainParams[currencyId]) {
      cosmosChainParams[currencyId] = new Desmos();
    }
    return cosmosChainParams[currencyId];
  } else if (currencyId === "injective") {
    if (!cosmosChainParams[currencyId]) {
      cosmosChainParams[currencyId] = new Injective();
    }
    return cosmosChainParams[currencyId];
  } else if (currencyId === "nyx") {
    if (!cosmosChainParams[currencyId]) {
      cosmosChainParams[currencyId] = new Nyx();
    }
    return cosmosChainParams[currencyId];
  } else if (currencyId === "onomy") {
    if (!cosmosChainParams[currencyId]) {
      cosmosChainParams[currencyId] = new Onomy();
    }
    return cosmosChainParams[currencyId];
  } else if (currencyId === "persistence") {
    if (!cosmosChainParams[currencyId]) {
      cosmosChainParams[currencyId] = new Persistence();
    }
    return cosmosChainParams[currencyId];
  } else if (currencyId === "quicksilver") {
    if (!cosmosChainParams[currencyId]) {
      cosmosChainParams[currencyId] = new Quicksilver();
    }
    return cosmosChainParams[currencyId];
  } else if (currencyId === "secret_network") {
    if (!cosmosChainParams[currencyId]) {
      cosmosChainParams[currencyId] = new SecretNetwork();
    }
    return cosmosChainParams[currencyId];
  } else if (currencyId === "sei_network") {
    if (!cosmosChainParams[currencyId]) {
      cosmosChainParams[currencyId] = new SeiNetwork();
    }
    return cosmosChainParams[currencyId];
  } else if (currencyId === "stargaze") {
    if (!cosmosChainParams[currencyId]) {
      cosmosChainParams[currencyId] = new Stargaze();
    }
    return cosmosChainParams[currencyId];
  } else if (currencyId === "stride") {
    if (!cosmosChainParams[currencyId]) {
      cosmosChainParams[currencyId] = new Stride();
    }
    return cosmosChainParams[currencyId];
  } else if (currencyId === "umee") {
    if (!cosmosChainParams[currencyId]) {
      cosmosChainParams[currencyId] = new Umee();
    }
    return cosmosChainParams[currencyId];
  } else {
    throw new Error(`${currencyId} is not supported`);
  }
  // TODO: Currently, all cosmos currencies included setSupportedCurrencies must be supported here. We are working on a new way to support/enable new currencies
}
