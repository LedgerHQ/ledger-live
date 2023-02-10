import CosmosBase from "./cosmosBase";
import Cosmos from "./Cosmos";
import Juno from "./Juno";
import Osmosis from "./Osmosis";

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
  } else {
    throw new Error(`${currencyId} is not supported`);
  }
  // TODO: Currently, all cosmos currencies included setSupportedCurrencies must be supported here. We are working on a new way to support/enable new currencies
}
