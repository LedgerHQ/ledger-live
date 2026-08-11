import { BigNumber } from "bignumber.js";
import { InvalidAddress, RecipientRequired } from "@ledgerhq/ledger-wallet-framework/errors";
import type { BitcoinOutput, ZcashAccount, Transaction } from "../types/bridge";
import { ZcashSaplingRecipientNotSupported } from "../types/errors";
import { classifyZcashRecipient } from "../logic/address";

// Transfer types that actually spend transparent UTXOs as inputs. A pure
// shielded send ("shielded" / "shielded-to-transparent") spends Orchard notes
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

export const computeRecipientError = (
  recipient: string,
  currencyName: string,
): Error | undefined => {
  if (!recipient) return new RecipientRequired("");
  const cls = classifyZcashRecipient(recipient);
  if (!("error" in cls)) return undefined;
  return cls.error === "sapling-unsupported"
    ? new ZcashSaplingRecipientNotSupported()
    : new InvalidAddress("", { currencyName });
};

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
