import { BigNumber } from "bignumber.js";
import { OP_RETURN_DATA_SIZE_LIMIT } from "@ledgerhq/wallet-btc/crypto/base";
import cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import type { Currency, ICrypto } from "@ledgerhq/wallet-btc/crypto/types";
import { DerivationModes } from "@ledgerhq/wallet-btc/types";
import {
  computeDustAmount,
  isValidAddress as walletBtcIsValidAddress,
  maxTxSizeCeil,
} from "@ledgerhq/wallet-btc/utils";
import type { ExplorerUtxo } from "../network/types";

export { DerivationModes, OP_RETURN_DATA_SIZE_LIMIT, maxTxSizeCeil };
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
export function dustThreshold(
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
 */
export function transactionSize(
  inputCount: number,
  recipientScript: Buffer,
  withChange: boolean,
  crypto: ICrypto,
  derivationMode: DerivationModes,
  extraOutputScripts: Buffer[] = [],
): number {
  return maxTxSizeCeil(
    Math.max(inputCount, 1),
    [recipientScript, ...extraOutputScripts],
    withChange,
    crypto,
    derivationMode,
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
  return a.hash === b.hash ? a.outputIndex - b.outputIndex : a.hash < b.hash ? -1 : 1;
}

/**
 * Picks the outputs a single-address transaction spends, and its fee.
 *
 * - `useAllAmount`: every output worth more than the fee to spend it is spent, with no change; the
 *   amount is what remains after the fee. Outputs worth less are left out, as the bridge's maximum
 *   spendable leaves them (wallet-btc `estimateAccountMaxSpendable`).
 * - Otherwise outputs are added deepest first until they cover the amount and the fee. Change below
 *   the dust threshold is not created: it is left to the fee.
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
}): UtxoSelection {
  const { amount, useAllAmount, recipientScript, crypto, derivationMode, feePerByte } = params;
  const utxos = [...params.utxos].sort(spendingOrder);

  const size = (inputCount: number, withChange: boolean) =>
    transactionSize(
      inputCount,
      recipientScript,
      withChange,
      crypto,
      derivationMode,
      params.extraOutputScripts,
    );
  const feeFor = (inputCount: number, withChange: boolean) =>
    params.fixedFee ?? BigInt(size(inputCount, withChange)) * feePerByte;

  if (useAllAmount) {
    // As the bridge: an output is worth spending when it pays more than its own input's fee, at a
    // rate of at least 1 sat/vB.
    const costToSpend =
      (feePerByte > 1n ? feePerByte : 1n) * BigInt(inputSize(crypto, derivationMode));
    const worthSpending = utxos.filter(utxo => BigInt(utxo.value) > costToSpend);
    const total = worthSpending.reduce((sum, utxo) => sum + BigInt(utxo.value), 0n);
    const fee = feeFor(worthSpending.length, false);
    const sendable = total - fee;
    return {
      inputs: worthSpending,
      fee,
      change: 0n,
      amount: sendable > 0n ? sendable : 0n,
      sufficient: sendable > 0n,
    };
  }

  const dustFor = (inputCount: number) =>
    dustThreshold(crypto, size(inputCount, true), derivationMode, params.relayFeePerByte);

  let total = 0n;
  for (let count = 1; count <= utxos.length; count++) {
    total += BigInt(utxos[count - 1].value);
    const feeWithoutChange = feeFor(count, false);
    if (total < amount + feeWithoutChange) continue;

    const change = total - amount - feeFor(count, true);
    if (change >= dustFor(count)) {
      return {
        inputs: utxos.slice(0, count),
        fee: total - amount - change,
        change,
        amount,
        sufficient: true,
      };
    }
    return {
      inputs: utxos.slice(0, count),
      fee: total - amount,
      change: 0n,
      amount,
      sufficient: true,
    };
  }

  // Not enough funds: price the transaction that would spend everything, with change.
  return { inputs: utxos, fee: feeFor(utxos.length, true), change: 0n, amount, sufficient: false };
}
