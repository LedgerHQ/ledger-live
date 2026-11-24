import BigNumber from "bignumber.js";
import cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import type { Currency, ICrypto } from "@ledgerhq/wallet-btc/crypto/types";
import { DerivationModes } from "@ledgerhq/wallet-btc/types";
import {
  computeDustAmount,
  isValidAddress as walletBtcIsValidAddress,
  maxTxSizeCeil,
} from "@ledgerhq/wallet-btc/utils";
import type { ExplorerUtxo } from "../network/types";

export { OP_RETURN_DATA_SIZE_LIMIT } from "@ledgerhq/wallet-btc/crypto/base";
export { DerivationModes, maxTxSizeCeil };
export type { ICrypto };

/**
 * wallet-btc's address check for a currency id. Throws when wallet-btc does not describe the
 * currency.
 */
export function isValidAddress(address: string, currencyId: string): boolean {
  return walletBtcIsValidAddress(address, currencyId as Currency);
}

/** wallet-btc's network description of a currency (address formats, dust policy, …). */
export function cryptoFor(currencyId: string): ICrypto {
  return cryptoFactory(currencyId as Currency);
}

/** How outputs are added to a transaction: see `selectUtxos`. */
export type UtxoStrategyName = "deep-outputs-first" | "optimize-size" | "merge-outputs";

export const UTXO_STRATEGIES: UtxoStrategyName[] = [
  "deep-outputs-first",
  "optimize-size",
  "merge-outputs",
];

export type UtxoSelection = {
  /** Outputs spent, in spending order. */
  inputs: ExplorerUtxo[];
  /** Fee actually paid: inputs − amount − change. */
  fee: bigint;
  /** Change sent back to the sender; 0n when the transaction has no change output. */
  change: bigint;
  /** Amount sent to the recipient. */
  amount: bigint;
  /** False when the outputs cannot cover the amount plus the fee. */
  sufficient: boolean;
};

/**
 * Derivation mode (input and change type) of a single-address account, read from the sender's
 * output script. Nested SegWit is the only P2SH form an account address takes.
 */
export function derivationModeOf(script: Buffer): DerivationModes {
  if (script.length === 25 && script[0] === 0x76 && script[1] === 0xa9)
    return DerivationModes.LEGACY;
  if (script.length === 23 && script[0] === 0xa9) return DerivationModes.SEGWIT;
  if (script.length === 22 && script[0] === 0x00 && script[1] === 0x14)
    return DerivationModes.NATIVE_SEGWIT;
  if (script.length === 34 && script[0] === 0x51 && script[1] === 0x20)
    return DerivationModes.TAPROOT;
  throw new Error("unsupported sender address type");
}

/**
 * Smallest output value the network relays for a transaction of `txSize` vbytes, as the bridge
 * computes it (wallet-btc's dust model; the relay fee is optional).
 */
function dustThreshold(
  crypto: ICrypto,
  txSize: number,
  derivationMode: DerivationModes,
  relayFeePerByte?: bigint,
): bigint {
  return BigInt(
    computeDustAmount(crypto, txSize, {
      derivationMode,
      relayFeePerByteSatVb:
        relayFeePerByte === undefined ? undefined : new BigNumber(relayFeePerByte.toString()),
    }),
  );
}

/**
 * Dust threshold of a payment from `sender` to `recipient` (a one-input transaction, without the
 * relay fee, which needs the network), or `undefined` when either address is not valid for the
 * currency.
 */
export function paymentDustThreshold(
  currencyId: string,
  sender: string,
  recipient: string,
): bigint | undefined {
  try {
    const crypto = cryptoFor(currencyId);
    const derivationMode = derivationModeOf(crypto.toOutputScript(sender));
    const recipientScript = crypto.toOutputScript(recipient);
    return dustThreshold(
      crypto,
      transactionSize(1, recipientScript, false, crypto, derivationMode),
      derivationMode,
    );
  } catch {
    return undefined;
  }
}

/**
 * Size, in vbytes, of a single-address transaction with `inputCount` inputs (at least one), paying
 * the recipient plus `extraOutputScripts` (an OP_RETURN output), with or without change.
 * `formatBytes` adds what the currency's format carries beyond wallet-btc's size maths (see
 * `planTransaction`).
 */
export function transactionSize(
  inputCount: number,
  recipientScript: Buffer,
  withChange: boolean,
  crypto: ICrypto,
  derivationMode: DerivationModes,
  extraOutputScripts: Buffer[] = [],
  formatBytes = 0,
): number {
  return (
    maxTxSizeCeil(
      Math.max(inputCount, 1),
      [recipientScript, ...extraOutputScripts],
      withChange,
      crypto,
      derivationMode,
    ) + formatBytes
  );
}

/** Size, in vbytes, that one input of the sender's type adds to a transaction. */
function inputSize(crypto: ICrypto, derivationMode: DerivationModes): number {
  return (
    maxTxSizeCeil(1, [], false, crypto, derivationMode) -
    maxTxSizeCeil(0, [], false, crypto, derivationMode)
  );
}

/**
 * Deepest outputs first: confirmed outputs by ascending height, then unconfirmed ones; ties by
 * outpoint, so the same outputs always yield the same selection. The bridge's default picking
 * strategy (wallet-btc `DeepFirst`, `bitcoinPickingStrategy.DEEP_OUTPUTS_FIRST`).
 */
function spendingOrder(a: ExplorerUtxo, b: ExplorerUtxo): number {
  const heightA = a.height ?? Number.POSITIVE_INFINITY;
  const heightB = b.height ?? Number.POSITIVE_INFINITY;
  if (heightA !== heightB) return heightA < heightB ? -1 : 1;
  if (a.hash !== b.hash) return a.hash < b.hash ? -1 : 1;
  return a.outputIndex - b.outputIndex;
}

const sumOf = (utxos: ExplorerUtxo[]) => utxos.reduce((sum, utxo) => sum + BigInt(utxo.value), 0n);

/** Smallest outputs first, to consolidate them (wallet-btc `Merge`); ties as `spendingOrder`. */
function smallestFirst(a: ExplorerUtxo, b: ExplorerUtxo): number {
  const valueA = BigInt(a.value);
  const valueB = BigInt(b.value);
  if (valueA !== valueB) return valueA < valueB ? -1 : 1;
  return spendingOrder(a, b);
}

/** Search budget of `optimizeSizePick`, as wallet-btc's `CoinSelect`. */
const OPTIMIZE_SIZE_TRIES = 100_000;

/**
 * Subset of `utxos` that covers `amount` and the fee at the least waste, or `undefined` when the
 * search finds none. A bigint port of wallet-btc `CoinSelect` (branch and bound over the outputs'
 * effective values, as Bitcoin Core's coin selection): outputs worth less than their own input's
 * fee are ignored, the rest are tried largest effective value first. The waste of a subset is its
 * fee, plus what it leaves above the target when no change output is created. Under an absolute
 * `fixedFee`, the target is the amount plus that fee, and an output's effective value is its value.
 */
function optimizeSizePick(
  utxos: ExplorerUtxo[],
  amount: bigint,
  outputScripts: Buffer[],
  feePerByte: bigint,
  crypto: ICrypto,
  derivationMode: DerivationModes,
  fixedFee?: bigint,
): ExplorerUtxo[] | undefined {
  const rate = feePerByte > 1n ? feePerByte : 1n;
  const sizeOf = (inputCount: number, withChange: boolean) =>
    BigInt(maxTxSizeCeil(inputCount, outputScripts, withChange, crypto, derivationMode));
  // An absolute fee is the whole fee: it goes in the target, and an input adds none on top. Priced
  // at the rate instead, a subset that only covers the fee at the rate would fail pricing and the
  // strategy would silently fall back to deepest first. The ranking (by size) is unchanged.
  const inputFee = fixedFee === undefined ? rate * BigInt(inputSize(crypto, derivationMode)) : 0n;
  const target = (fixedFee ?? rate * sizeOf(0, false)) + amount;

  const effective = utxos
    .map(utxo => ({ utxo, value: BigInt(utxo.value) - inputFee }))
    .filter(candidate => candidate.value > 0n)
    .sort(largestEffectiveFirst);
  if (effective.reduce((sum, candidate) => sum + candidate.value, 0n) < target) return undefined;
  const changeCost = rate * (sizeOf(0, true) - sizeOf(0, false));

  // A subset worth `value` above the target: with change when the excess pays for it, otherwise the
  // excess is burned as fee.
  const wasteOf = (value: bigint, count: number) =>
    value - target >= changeCost
      ? rate * sizeOf(count, true)
      : rate * sizeOf(count, false) + value - target;

  const best = leastWasteSubset(
    effective.map(candidate => candidate.value),
    target,
    wasteOf,
  );
  if (!best) return undefined;
  const picked: ExplorerUtxo[] = [];
  for (let node = best.last; node; node = node.previous) picked.push(effective[node.index].utxo);
  return picked.reverse();
}

/** Largest effective value first; ties as `spendingOrder`, so the search is deterministic. */
function largestEffectiveFirst(
  a: { utxo: ExplorerUtxo; value: bigint },
  b: { utxo: ExplorerUtxo; value: bigint },
): number {
  if (a.value !== b.value) return a.value > b.value ? -1 : 1;
  return spendingOrder(a.utxo, b.utxo);
}

/** A taken candidate of `leastWasteSubset`'s search, linked to the one taken before it. */
type TakenNode = { index: number; count: number; previous: TakenNode | undefined };

type WastedSubset = { last: TakenNode | undefined; waste: bigint };

const countOf = (last: TakenNode | undefined) => last?.count ?? 0;

/** The subset ending at `last` when it wastes no more than `best`: a tie keeps the later one. */
const leastWaste = (
  best: WastedSubset | undefined,
  last: TakenNode | undefined,
  waste: bigint,
): WastedSubset => (!best || waste <= best.waste ? { last, waste } : best);

/**
 * The depth-first search of `optimizeSizePick` (wallet-btc `CoinSelect`): candidates are taken in
 * order, and a branch is left as soon as it covers `target` or runs out of candidates. Of the
 * covering subsets met within the budget, the one of least waste is kept, the last one on a tie.
 *
 * The taken candidates are a list from the last one taken back to the first. Nodes never change, so
 * the best subset is kept as a pointer rather than a copy: a long search over large subsets would
 * otherwise copy each of them.
 */
function leastWasteSubset(
  values: bigint[],
  target: bigint,
  wasteOf: (value: bigint, count: number) => bigint,
): WastedSubset | undefined {
  const taken: boolean[] = [];
  let last: TakenNode | undefined;
  let value = 0n;
  let best: WastedSubset | undefined;
  for (let tries = 0; tries < OPTIMIZE_SIZE_TRIES; tries++) {
    const covers = value >= target;
    if (covers) best = leastWaste(best, last, wasteOf(value, countOf(last)));
    if (!covers && taken.length < values.length) {
      taken.push(true);
      last = { index: taken.length - 1, count: countOf(last) + 1, previous: last };
      value += values[taken.length - 1];
      continue;
    }
    // Backtrack: skip the last taken candidate, past the ones skipped after it.
    while (taken.length > 0 && !taken.at(-1)) taken.pop();
    if (taken.length === 0) break;
    taken[taken.length - 1] = false;
    last = last?.previous;
    value -= values[taken.length - 1];
  }
  return best;
}

/**
 * Picks the outputs a single-address transaction spends, and its fee.
 *
 * - `useAllAmount`: every output worth more than the fee to spend it is spent, with no change; the
 *   amount is what remains after the fee. Outputs worth less are left out, as the bridge's maximum
 *   spendable leaves them (wallet-btc `estimateAccountMaxSpendable`).
 * - Otherwise outputs are added, in the order of `strategy`, until they cover the amount and the
 *   fee. Change below the dust threshold is not created: it is left to the fee.
 *
 * `utxos` are the candidates (the caller has already left out the excluded outputs). With
 * `selected`, the inputs are exactly those outputs, as the bridge's coin control: a payment is
 * insufficient when they do not cover the amount and the fee, and a sweep spends all of them, even
 * those not worth their own input's fee. `strategy` orders the candidates when nothing is selected.
 *
 * Sizes and the dust threshold come from wallet-btc's pure size maths, as for the bridge.
 */
export function selectUtxos(params: {
  utxos: ExplorerUtxo[];
  amount: bigint;
  useAllAmount: boolean;
  recipientScript: Buffer;
  crypto: ICrypto;
  derivationMode: DerivationModes;
  feePerByte: bigint;
  relayFeePerByte: bigint;
  /** Absolute fee imposed by the caller, instead of size × `feePerByte`. */
  fixedFee?: bigint;
  /** Outputs paid besides the recipient and the change (an OP_RETURN output), for sizes. */
  extraOutputScripts?: Buffer[];
  /** Bytes the currency's format adds to a transaction of so many inputs (see `transactionSize`). */
  formatBytes?: (inputCount: number) => number;
  /** Outputs to spend, and the only ones: `utxos` are then ignored. */
  selected?: ExplorerUtxo[];
  /** Order in which candidates are added. Default: deepest first. */
  strategy?: UtxoStrategyName;
}): UtxoSelection {
  const { amount, useAllAmount, recipientScript, crypto, derivationMode, feePerByte } = params;
  const strategy = params.strategy ?? "deep-outputs-first";
  const selected = [...(params.selected ?? [])].sort(spendingOrder);
  const hasSelection = selected.length > 0;
  const utxos = [...params.utxos].sort(spendingOrder);

  const size = (inputCount: number, withChange: boolean) =>
    transactionSize(
      inputCount,
      recipientScript,
      withChange,
      crypto,
      derivationMode,
      params.extraOutputScripts,
      params.formatBytes?.(inputCount) ?? 0,
    );
  const feeFor = (inputCount: number, withChange: boolean) =>
    params.fixedFee ?? BigInt(size(inputCount, withChange)) * feePerByte;

  if (useAllAmount) {
    const inputs = hasSelection
      ? selected
      : worthSpending(utxos, feePerByte, crypto, derivationMode);
    return sweep(inputs, feeFor(inputs.length, false));
  }

  const dustFor = (inputCount: number) =>
    dustThreshold(crypto, size(inputCount, true), derivationMode, params.relayFeePerByte);

  // The selection these inputs make, or undefined when they do not cover the amount and the fee.
  const priceInputs = (inputs: ExplorerUtxo[], total: bigint): UtxoSelection | undefined => {
    if (total < amount + feeFor(inputs.length, false)) return undefined;
    const change = total - amount - feeFor(inputs.length, true);
    if (change >= dustFor(inputs.length)) {
      return { inputs, fee: total - amount - change, change, amount, sufficient: true };
    }
    return { inputs, fee: total - amount, change: 0n, amount, sufficient: true };
  };

  // Not enough funds: price the transaction that would spend all of `inputs`, with change.
  const insufficient = (inputs: ExplorerUtxo[]): UtxoSelection => ({
    inputs,
    fee: feeFor(inputs.length, true),
    change: 0n,
    amount,
    sufficient: false,
  });

  if (hasSelection) return priceInputs(selected, sumOf(selected)) ?? insufficient(selected);

  if (strategy === "optimize-size") {
    const picked = optimizeSizePick(
      utxos,
      amount,
      [recipientScript, ...(params.extraOutputScripts ?? [])],
      feePerByte,
      crypto,
      derivationMode,
      params.fixedFee,
    );
    const inputs = picked?.sort(spendingOrder);
    const priced = inputs && priceInputs(inputs, sumOf(inputs));
    if (priced) return priced;
  }

  const ordered = strategy === "merge-outputs" ? [...utxos].sort(smallestFirst) : utxos;
  return firstCoveringPrefix(ordered, amount, feeFor, priceInputs) ?? insufficient(ordered);
}

/**
 * As the bridge: an output is worth spending in a sweep when it pays more than its own input's fee,
 * at a rate of at least 1 sat/vB.
 */
function worthSpending(
  utxos: ExplorerUtxo[],
  feePerByte: bigint,
  crypto: ICrypto,
  derivationMode: DerivationModes,
): ExplorerUtxo[] {
  const costToSpend =
    (feePerByte > 1n ? feePerByte : 1n) * BigInt(inputSize(crypto, derivationMode));
  return utxos.filter(utxo => BigInt(utxo.value) > costToSpend);
}

/** A sweep of `inputs`: all they hold, minus the fee, with no change. */
function sweep(inputs: ExplorerUtxo[], fee: bigint): UtxoSelection {
  const sendable = sumOf(inputs) - fee;
  return {
    inputs,
    fee,
    change: 0n,
    amount: sendable > 0n ? sendable : 0n,
    sufficient: sendable > 0n,
  };
}

/**
 * The selection of the shortest prefix of `ordered` that covers the payment, or `undefined`. A
 * prefix is priced only once its total can cover the amount and the fee: slicing every prefix is
 * quadratic.
 */
function firstCoveringPrefix(
  ordered: ExplorerUtxo[],
  amount: bigint,
  feeFor: (inputCount: number, withChange: boolean) => bigint,
  priceInputs: (inputs: ExplorerUtxo[], total: bigint) => UtxoSelection | undefined,
): UtxoSelection | undefined {
  let total = 0n;
  for (let count = 1; count <= ordered.length; count++) {
    total += BigInt(ordered[count - 1].value);
    if (total < amount + feeFor(count, false)) continue;
    const priced = priceInputs(ordered.slice(0, count), total);
    if (priced) return priced;
  }
  return undefined;
}
