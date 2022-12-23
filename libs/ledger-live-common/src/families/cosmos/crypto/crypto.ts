import cosmosBase from "./cosmosBase";
import Cosmos from "./Cosmos";
import Juno from "./Juno";
import Osmosis from "./Osmosis";

export default function cryptoFactory(currencyId: string): cosmosBase {
  let res: cosmosBase;
  if (currencyId === "osmosis" || currencyId === "osmo") {
    res = new Osmosis();
  } else if (currencyId === "cosmos") {
    res = new Cosmos();
  } else if (currencyId === "juno") {
    res = new Juno();
  } else {
    throw new Error(`${currencyId} is not supported`);
  }
  return res;
}
