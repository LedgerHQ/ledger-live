import { BigNumber } from "bignumber.js";
import type {
  BitcoinResourcesRaw,
  BitcoinResources,
  BitcoinInputRaw,
  BitcoinInput,
  BitcoinOutputRaw,
  BitcoinOutput,
} from "./types";
export function toBitcoinInputRaw({
  address,
  value,
  previousTxHash,
  previousOutputIndex,
}: BitcoinInput): BitcoinInputRaw {
  return [
    address,
    value ? value.toString() : undefined,
    previousTxHash,
    previousOutputIndex,
  ];
}
export function fromBitcoinInputRaw([
  address,
  value,
  previousTxHash,
  previousOutputIndex,
]: BitcoinInputRaw): BitcoinInput {
  return {
    address: address || undefined,
    value: value ? new BigNumber(value) : undefined,
    previousTxHash: previousTxHash || undefined,
    previousOutputIndex,
  };
}
export function toBitcoinOutputRaw({
  hash,
  outputIndex,
  blockHeight,
  address,
  path,
  value,
  rbf,
}: BitcoinOutput): BitcoinOutputRaw {
  return [
    hash,
    outputIndex,
    blockHeight,
    address,
    path,
    value.toString(),
    rbf ? 1 : 0,
  ];
}
export function fromBitcoinOutputRaw([
  hash,
  outputIndex,
  blockHeight,
  address,
  path,
  value,
  rbf,
]: BitcoinOutputRaw): BitcoinOutput {
  return {
    hash,
    outputIndex,
    blockHeight: blockHeight || undefined,
    address: address || undefined,
    path: path || undefined,
    value: new BigNumber(value),
    rbf: !!rbf,
  };
}
export function toBitcoinResourcesRaw(
  r: BitcoinResources
): BitcoinResourcesRaw {
  return {
    utxos: r.utxos.map(toBitcoinOutputRaw),
  };
}
export function fromBitcoinResourcesRaw(
  r: BitcoinResourcesRaw
): BitcoinResources {
  return {
    utxos: r.utxos.map(fromBitcoinOutputRaw),
  };
}
