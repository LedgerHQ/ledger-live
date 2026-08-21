import { BigNumber } from "bignumber.js";
import { InvalidAddress, RecipientRequired } from "@ledgerhq/ledger-wallet-framework/errors";
import type { BitcoinOutput, ZcashAccount, Transaction } from "../types/bridge";
import { ZcashSaplingRecipientNotSupported, ZcashShieldedKeyMissing } from "../types/errors";
import { classifyZcashRecipient } from "../logic/address";
import { TRANSPARENT_OUTPUT_DUST_THRESHOLD } from "../logic/coin-selection";

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
  return tx.selectedUtxos ?? account.bitcoinResources?.utxos ?? [];
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
