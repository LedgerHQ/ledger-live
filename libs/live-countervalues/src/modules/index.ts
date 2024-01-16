import type { Module } from "./types";
import weth from "./weth";
import type { Currency } from "@ledgerhq/types-cryptoassets";

const modules: Module[] = [weth];

export const aliasPair = (pair: {
  from: Currency;
  to: Currency;
}): {
  from: Currency;
  to: Currency;
} => modules.reduce((pair, m) => m.aliasPair(pair), pair);

export const resolveTrackingPair = (pair: {
  from: Currency;
  to: Currency;
}): {
  from: Currency;
  to: Currency;
} => {
  return modules.reduce((pair, module) => module.resolveTrackingPair(pair), pair);
};
