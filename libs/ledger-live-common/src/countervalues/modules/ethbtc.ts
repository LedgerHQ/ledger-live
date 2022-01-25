import type { Module } from "./types";
import { getCryptoCurrencyById } from "../../currencies";
import { Pair } from "./types";
// ETH BTC is a special case to handle
// no exchange support BTC->ETH but then do ETH->BTC
// so when user chose ETH as countervalues we need to actually ask ETH->BTC reverse the rate
const ETH = getCryptoCurrencyById("ethereum");
const BTC = getCryptoCurrencyById("bitcoin");

const remap = (pair: Pair): Pair =>
  pair.from === BTC && pair.to === ETH
    ? {
        from: ETH,
        to: BTC,
      }
    : pair;

const mapRate = (pair: Pair, rate: number): number =>
  pair.from === BTC && pair.to === ETH ? 1 / rate : rate;

const mod: Module = {
  aliasPair: remap,
  resolveTrackingPair: remap,
  mapRate,
};

export default mod;
