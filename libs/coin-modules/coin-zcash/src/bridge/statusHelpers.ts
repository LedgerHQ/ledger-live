import { BigNumber } from "bignumber.js";
import { InvalidAddress, RecipientRequired } from "@ledgerhq/ledger-wallet-framework/errors";
import type { BitcoinOutput, ZcashAccount, Transaction } from "../types/bridge";
import { ZcashSaplingRecipientNotSupported, ZcashShieldedKeyMissing } from "../types/errors";
import { classifyZcashRecipient } from "../logic/address";
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
 * Resolves the transparent UTXOs spent by a Public→* flow. Returns an empty
 * set for transfer types that do not spend transparent inputs. Caller-supplied
 * `selectedUtxos` takes precedence over the account's synced UTXO set.
 */
export function resolveTransparentUtxos(account: ZcashAccount, tx: Transaction): BitcoinOutput[] {
  if (!TRANSPARENT_INPUT_TRANSFER_TYPES.has(tx.transferType)) return [];
  const utxos = tx.selectedUtxos ?? account.bitcoinResources?.utxos ?? [];
  // Largest-first, then bounded to the device's per-PCZT input ceiling: picking
  // the largest N maximizes the amount a single send can carry (ZIP-317 prices
  // per input, so more of the account's value per spent input is strictly
  // better) and mirrors the "largest-first stays" selection strategy already
  // used on the shielded side (logic/coin-selection.ts's selectNotes).
  return [...utxos]
    .sort((a, b) => b.value.comparedTo(a.value))
    .slice(0, ZCASH_MAX_TRANSPARENT_INPUTS);
}

/**
 * True when the transparent-input bound is the reason `totalSpent` cannot be
 * covered -- the account's full transparent balance covers it, only the
 * bounded PCZT (device-safe) selection does not. Lets the caller raise a
 * "too large for one send" error instead of NotEnoughBalance in exactly that
 * case, and never in a genuine-shortfall case.
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
): Error | undefined => {
  if (!recipient) return new RecipientRequired("");
  const cls = classifyZcashRecipient(recipient);
  if ("error" in cls) {
    return cls.error === "sapling-unsupported"
      ? new ZcashSaplingRecipientNotSupported()
      : new InvalidAddress("", { currencyName });
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
