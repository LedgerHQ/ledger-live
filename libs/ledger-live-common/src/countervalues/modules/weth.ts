import type { Module } from "./types";
import { getCryptoCurrencyById } from "../../currencies";
const ETH = getCryptoCurrencyById("ethereum");

const remap = (pair) => {
  if (pair.from.ticker === "WETH")
    return {
      from: ETH,
      to: pair.to,
    };
  if (pair.to.ticker === "WETH")
    return {
      from: pair.from,
      to: ETH,
    };
  return pair;
};

const mod: Module = {
  aliasPair: remap,
  resolveTrackingPair: remap,
};
export default mod;
