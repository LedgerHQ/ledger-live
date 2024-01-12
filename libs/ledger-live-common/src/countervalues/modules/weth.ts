import type { Module, Pair } from "./types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";

const ETH = getCryptoCurrencyById("ethereum");

const wethId = "ethereum/erc20/weth";

const remap = (pair: Pair): Pair => {
  if (pair.from.type === "TokenCurrency" && pair.from.id === wethId)
    return { from: ETH, to: pair.to };
  if (pair.to.type === "TokenCurrency" && pair.to.id === wethId)
    return { from: pair.from, to: ETH };
  return pair;
};

const mod: Module = {
  aliasPair: remap,
  resolveTrackingPair: remap,
};
export default mod;
