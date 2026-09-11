import { BigNumber } from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { getTransparentBalance } from "@ledgerhq/coin-zcash/logic/account/balance";
import {
  collectSelectableIronwoodNotes,
  getSpendableIronwoodBalance,
  hasMaturingIronwoodNotes,
} from "@ledgerhq/coin-zcash/logic/account/spendability";
import { boundTransparentUtxos } from "@ledgerhq/coin-zcash/bridge/statusHelpers";
import { getReservedNullifiers } from "@ledgerhq/coin-zcash/bridge/note-reservation";
import type { Transaction as ZcashTransaction, ZcashAccount } from "@ledgerhq/coin-zcash/types";
import type {
  BalanceTypeConfig,
  BalanceTypeOption,
  BalanceTypeSelfTransferTarget,
  TransactionPatch,
} from "../../../bridge/descriptor/types";

/** The pool a spend draws from, as recorded on the transaction's `sender`. */
type ZcashSender = NonNullable<ZcashTransaction["sender"]>;

const PUBLIC: ZcashSender = "public";
const PRIVATE: ZcashSender = "private";

/** Pool ids double as `sender` values, so a selection patch never needs a mapping. */
function isZcashSender(optionId: string): optionId is ZcashSender {
  return optionId === PUBLIC || optionId === PRIVATE;
}

function isZcashMainAccount(account: AccountLike): account is ZcashAccount {
  return account.type === "Account" && account.currency.id === "zcash";
}

function hasShieldedViewingKey(account: ZcashAccount): boolean {
  return Boolean(account.privateInfo?.ufvk);
}

function isZcashTransaction(transaction: unknown): transaction is ZcashTransaction {
  return (
    typeof transaction === "object" &&
    transaction !== null &&
    "family" in transaction &&
    transaction.family === "zcash"
  );
}

/**
 * The pool a spend draws from, defaulting to the transparent one: a transaction carries
 * no `sender` until the user picks a pool, and the transparent pool is what the bridge
 * spends from in that state.
 */
function resolveSender(transaction: unknown): ZcashSender {
  if (!isZcashTransaction(transaction)) return PUBLIC;
  return transaction.sender === PRIVATE ? PRIVATE : PUBLIC;
}

function getOptions({ account }: { account: AccountLike }): readonly BalanceTypeOption[] {
  if (!isZcashMainAccount(account)) return [];

  const options: BalanceTypeOption[] = [
    {
      id: PUBLIC,
      translationKey: "balanceType.transparent",
      balance: getTransparentBalance(account.bitcoinResources?.utxos),
      hasPendingBalance: false,
      icon: "check" as const,
    },
  ];

  if (!hasShieldedViewingKey(account)) return options;

  options.push({
    id: PRIVATE,
    translationKey: "balanceType.shielded",
    balance: getSpendableIronwoodBalance(account, getReservedNullifiers(account)),
    // A freshly shielded or change note is owned but still too young to spend, so the
    // spendable figure above trails the total until it matures.
    hasPendingBalance: hasMaturingIronwoodNotes(account),
    icon: "lock" as const,
  });

  return options;
}

function getSelfTransferTarget({
  account,
  transaction,
}: {
  account: AccountLike;
  transaction: unknown;
}): BalanceTypeSelfTransferTarget | null {
  if (!isZcashMainAccount(account) || !hasShieldedViewingKey(account)) return null;

  // A self-transfer moves funds to the pool the spend is not drawing from: shielding
  // transparent funds, or unshielding private ones.
  if (resolveSender(transaction) === PUBLIC) {
    const shieldedAddress = account.privateInfo?.shieldedAddress;
    if (!shieldedAddress) return null;
    return {
      address: shieldedAddress,
      translationKey: "recipient.selfTransfer.toPrivate",
      isDestinationPublic: false,
    };
  }

  if (!account.freshAddress) return null;
  return {
    address: account.freshAddress,
    translationKey: "recipient.selfTransfer.toPublic",
    isDestinationPublic: true,
  };
}

/**
 * `selfTransfer` is never inferred from the recipient (an address the user could also
 * have typed), so the flow records it on every recipient write. The bridge reads it back
 * as `recipientIsReadOnly`.
 */
function buildSelfTransferPatch({ isSelfTransfer }: { isSelfTransfer: boolean }): TransactionPatch {
  return { selfTransfer: isSelfTransfer };
}

/**
 * Balance the amount step may spend from the given pool, bounded by the 32-input ceiling.
 * `getOptions` returns the full spendable figure (display accuracy); this function caps it
 * to the inputs the bridge can actually include in one transaction.
 */
function getSelectableBalance({
  account,
  optionId,
}: {
  account: AccountLike;
  optionId: string;
}): BigNumber {
  if (!isZcashMainAccount(account)) return new BigNumber(0);

  if (optionId === PRIVATE) {
    if (!hasShieldedViewingKey(account)) return new BigNumber(0);
    const notes = collectSelectableIronwoodNotes(account, getReservedNullifiers(account));
    return notes.reduce((sum, n) => sum.plus(n.amount), new BigNumber(0));
  }

  if (optionId === PUBLIC) {
    const utxos = boundTransparentUtxos(account.bitcoinResources?.utxos ?? []);
    return utxos.reduce((sum, u) => sum.plus(u.value), new BigNumber(0));
  }

  return new BigNumber(0);
}

export const zcashBalanceTypeConfig: BalanceTypeConfig = {
  getOptions,
  getSelectedOptionId: transaction =>
    isZcashTransaction(transaction) ? (transaction.sender ?? null) : null,
  buildSelectionPatch: optionId => (isZcashSender(optionId) ? { sender: optionId } : {}),
  getSelfTransferTarget,
  buildSelfTransferPatch,
  getSelectableBalance,
};
