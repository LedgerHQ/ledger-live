import { BigNumber } from "bignumber.js";
import type { BitcoinOutput, BitcoinOutputRaw } from "./types";

export function toBitcoinOutputRaw({
  hash,
  outputIndex,
  blockHeight,
  address,
  value,
  rbf,
  isChange,
}: BitcoinOutput): BitcoinOutputRaw {
  return [hash, outputIndex, blockHeight, address, value.toString(), rbf ? 1 : 0, isChange ? 1 : 0];
}

export function fromBitcoinOutputRaw([
  hash,
  outputIndex,
  blockHeight,
  address,
  value,
  rbf,
  isChange,
]: BitcoinOutputRaw): BitcoinOutput {
  return {
    hash,
    outputIndex,
    blockHeight: blockHeight || undefined,
    address: address || undefined,
    value: new BigNumber(value),
    rbf: !!rbf,
    isChange: !!isChange,
  };
}
