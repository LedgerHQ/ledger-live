import BigNumber from "bignumber.js";
import { InvalidAddress, RecipientRequired } from "@ledgerhq/ledger-wallet-framework/errors";
import type { BitcoinOutput, BtcOperationExtra, ZcashAccount, Transaction } from "../types/bridge";
import { ZcashSaplingRecipientNotSupported, ZcashShieldedKeyMissing } from "../types/errors";
import { classifyZcashRecipient } from "../logic/address";
import { zcashNetworkOf } from "../logic/network";
import { isValidZcashAddress } from "../logic/validateAddress";
import { TRANSPARENT_OUTPUT_DUST_THRESHOLD } from "../logic/coin-selection";
import { ZCASH_MAX_TRANSPARENT_INPUTS } from "../constants";

// Transfer types that actually spend transparent UTXOs as inputs. A pure
// shielded send ("shielded" / "shielded-to-transparent") spends Ironwood notes
// only and must never pull in the account's transparent UTXOs -- so only
// these types resolve to a non-empty transparent input set. "transparent"
// (Public→Public t→t) is included: coin-zcash builds it as a PCZT that spends
// transparent UTXOs into a transparent output, sharing the same
// transparent-input machinery as "transparent-to-shielded".
export const TRANSPARENT_INPUT_TRANSFER_TYPES = new Set<Transaction["transferType"]>([
  "transparent-to-shielded",
  "transparent",
]);

export const isTransparentInputTransfer = (transferType: Transaction["transferType"]): boolean =>
  TRANSPARENT_INPUT_TRANSFER_TYPES.has(transferType);

/**
 * Sorts the account's synced transparent UTXOs largest-first and bounds them
 * to the device's per-PCZT input ceiling: picking the largest N maximizes the
 * amount a single send can carry (ZIP-317 prices per input, so more of the
 * account's value per spent input is strictly better) and mirrors the
 * "largest-first stays" selection strategy already used on the shielded side
 * (logic/coin-selection.ts's selectNotes).
 *
 * Shared by `resolveTransparentUtxos` (below) and `estimateMaxSpendable`'s
 * no-transaction fallback, so "Max" can never disagree with what a real send
 * would bound its input set to -- a caller-supplied `selectedUtxos` override
 * is deliberately never passed through here (see `resolveTransparentUtxos`).
 */
export function boundTransparentUtxos(utxos: BitcoinOutput[]): BitcoinOutput[] {
  return [...utxos]
    .sort((a, b) => b.value.comparedTo(a.value))
    .slice(0, ZCASH_MAX_TRANSPARENT_INPUTS);
}

/**
 * Outpoints, as `hash-outputIndex`, that the account's pending operations already spend. Reads
 * `extra.inputRefs`, else the `hash-outputIndex` strings of `extra.inputs`.
 */
export function pendingSpentOutpoints(account: ZcashAccount): Set<string> {
  const spent = new Set<string>();
  for (const op of account.pendingOperations ?? []) {
    const extra = op.extra as BtcOperationExtra | null | undefined;
    if (extra === null || typeof extra !== "object") continue;
    if (Array.isArray(extra.inputRefs) && extra.inputRefs.length > 0) {
      for (const { hash, outputIndex } of extra.inputRefs) spent.add(`${hash}-${outputIndex}`);
    } else if (Array.isArray(extra.inputs)) {
      for (const outpoint of extra.inputs) spent.add(outpoint);
    }
  }
  return spent;
}

/** The outputs the account's pending operations already spend, as `{ hash, outputIndex }`. */
export function pendingSpentInputs(
  account: ZcashAccount,
): Array<{ hash: string; outputIndex: number }> {
  return [...pendingSpentOutpoints(account)].flatMap(outpoint => {
    const separator = outpoint.lastIndexOf("-");
    const outputIndex = Number(outpoint.slice(separator + 1));
    return separator > 0 && Number.isInteger(outputIndex)
      ? [{ hash: outpoint.slice(0, separator), outputIndex }]
      : [];
  });
}

/**
 * Drops the UTXOs a pending operation of the account already spends. A just-broadcast spend may
 * not be reflected in the synced UTXO set yet, so those outputs are not available to a new
 * transaction.
 */
export function excludePendingInputs(
  account: ZcashAccount,
  utxos: BitcoinOutput[],
): BitcoinOutput[] {
  const spent = pendingSpentOutpoints(account);
  if (spent.size === 0) return utxos;
  return utxos.filter(utxo => !spent.has(`${utxo.hash}-${utxo.outputIndex}`));
}

/**
 * Resolves the transparent UTXOs spent by a Public→* flow. Returns an empty
 * set for transfer types that do not spend transparent inputs. Caller-supplied
 * `selectedUtxos` takes precedence over the account's synced UTXO set.
 */
export function resolveTransparentUtxos(account: ZcashAccount, tx: Transaction): BitcoinOutput[] {
  if (!TRANSPARENT_INPUT_TRANSFER_TYPES.has(tx.transferType)) return [];
  // A caller-supplied override is an explicit UTXO selection (coin control),
  // not a pool the wallet is free to pick from -- reordering or truncating it
  // would silently spend a different set than the caller asked for, so it
  // passes through exactly as it did before this ceiling existed. Only the
  // account-synced default set is bounded.
  if (tx.selectedUtxos) return tx.selectedUtxos;
  return boundTransparentUtxos(account.bitcoinResources?.utxos ?? []);
}

/**
 * True when the transparent-input bound is the reason `totalSpent` cannot be
 * covered -- the account's full transparent balance covers it, only the
 * bounded PCZT (device-safe) selection does not. Lets the caller raise a
 * "too large for one send" error instead of NotEnoughBalance in exactly that
 * case, and never in a genuine-shortfall case.
 *
 * Inherits `resolveTransparentUtxos`'s exclusion of `tx.selectedUtxos`: a
 * caller-supplied override is never bounded (see that function's comment), so
 * this always answers `false` when one is set, however many UTXOs it holds --
 * there is no bounded-only shortfall to report for an unbounded set.
 */
export function hasBoundedTransparentShortfall(
  account: ZcashAccount,
  tx: Transaction,
  totalSpent: BigNumber,
): boolean {
  if (!TRANSPARENT_INPUT_TRANSFER_TYPES.has(tx.transferType)) return false;
  const allUtxos = tx.selectedUtxos ?? account.bitcoinResources?.utxos ?? [];
  if (allUtxos.length <= ZCASH_MAX_TRANSPARENT_INPUTS) return false; // nothing was bounded
  const fullBalance = allUtxos.reduce((sum, u) => sum.plus(u.value), new BigNumber(0));
  const boundedBalance = resolveTransparentUtxos(account, tx).reduce(
    (sum, u) => sum.plus(u.value),
    new BigNumber(0),
  );
  return totalSpent.gt(boundedBalance) && totalSpent.lte(fullBalance);
}

/**
 * Whether the account can take part in the shielded pools at all, which is what
 * having exported the UFVK from the device amounts to. An empty string counts as
 * absent, as everywhere else (see `bridge/signOperation`, `sync.ts`).
 */
export const hasShieldedKey = (account: ZcashAccount): boolean =>
  Boolean(account.privateInfo?.ufvk);

/**
 * `shieldedKeyAvailable` gates the shielded recipient classes. Paying an Orchard
 * receiver builds a transaction with a shielded bundle, which the builder can
 * only assemble from the account's UFVK -- so without one the address is not a
 * recipient this account can pay, and saying so here keeps the send flow from
 * accepting it and failing at the device step instead.
 */
export const computeRecipientError = (
  recipient: string,
  currencyName: string,
  shieldedKeyAvailable: boolean,
  currencyId: string = "zcash",
): Error | undefined => {
  if (!recipient) return new RecipientRequired("");
  const cls = classifyZcashRecipient(recipient, zcashNetworkOf(currencyId));
  if ("error" in cls) {
    return cls.error === "sapling-unsupported"
      ? new ZcashSaplingRecipientNotSupported()
      : new InvalidAddress("", { currencyName });
  }
  // The classifier reads a transparent address's prefix and length only; the
  // Base58Check checksum is what rejects a mistyped one.
  if (recipient.startsWith("t") && !isValidZcashAddress(recipient, currencyId)) {
    return new InvalidAddress("", { currencyName });
  }
  if (cls.recipientType === "private" && !shieldedKeyAvailable) {
    return new ZcashShieldedKeyMissing();
  }
  return undefined;
};

/** True when `amount` (zatoshis) is below the dust floor for a transparent
 * output. A non-positive amount isn't "dust" -- that's caught separately. */
export const isTransparentOutputDust = (amount: BigNumber): boolean =>
  amount.gt(0) && amount.lt(TRANSPARENT_OUTPUT_DUST_THRESHOLD);

export const computeAmountError = (
  tx: Transaction,
  totalSpent: BigNumber,
  orchardBalance: BigNumber,
): Error | undefined => {
  if (tx.amount.lte(0) && !tx.useAllAmount) return new Error("Amount must be positive");
  if (!tx.selectedNotes || tx.selectedNotes.length === 0)
    return new Error("Insufficient shielded balance");
  if (totalSpent.gt(orchardBalance)) return new Error("Insufficient shielded balance");
  const selectedTotal = tx.selectedNotes.reduce((sum, n) => sum.plus(n.amount), new BigNumber(0));
  if (selectedTotal.lt(totalSpent)) return new Error("Selected notes do not cover amount + fee");
  return undefined;
};
