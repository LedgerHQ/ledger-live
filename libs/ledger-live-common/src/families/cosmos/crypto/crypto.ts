import CosmosBase from "./cosmosBase";
import Cosmos from "./Cosmos";
import Juno from "./Juno";
import Osmosis from "./Osmosis";

export default function cryptoFactory(currencyId: string): CosmosBase {
  if (currencyId === "osmosis" || currencyId === "osmo") {
    return new Osmosis();
  } else if (currencyId === "cosmos") {
    return new Cosmos();
  } else if (currencyId === "juno") {
    return new Juno();
  } else {
    throw new Error(`${currencyId} is not supported`);
  }
}
