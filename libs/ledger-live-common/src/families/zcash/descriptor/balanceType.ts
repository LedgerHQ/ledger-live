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
} from "../../../bridge/descriptor/types";

/** The pool a spend draws from, as recorded on the transaction's `sender`. */
type ZcashSender = NonNullable<ZcashTransaction["sender"]>;

const PUBLIC: ZcashSender = "public";
const PRIVATE: ZcashSender = "private";

/** Pool ids double as `sender` values, so a selection patch never needs a mapping. */
function isZcashSender(optionId: string): optionId is ZcashSender {
  return optionId === PUBLIC || optionId === PRIVATE;
}

function isZcashBasedAccount(account: AccountLike): account is ZcashAccount {
  return "bitcoinResources" in account && account.bitcoinResources !== undefined;
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
  if (!isZcashBasedAccount(account)) return [];

  // What the send flow can actually select from, not the account's totals: the spendable
  // Ironwood notes (mature and unreserved) and the account's own transparent UTXOs. Both
  // figures come from the same helpers note selection uses, so what the user reads here
  // and what a spend can cover cannot disagree.
  const spendablePrivateBalance = getSpendableIronwoodBalance(
    account,
    getReservedNullifiers(account),
  );

  return [
    {
      id: PUBLIC,
      translationKey: "balanceType.transparent",
      balance: getTransparentBalance(account.bitcoinResources?.utxos),
      hasPendingBalance: false,
      icon: "check" as const,
    },
    {
      id: PRIVATE,
      translationKey: "balanceType.shielded",
      balance: spendablePrivateBalance,
      // A freshly shielded or change note is owned but still too young to spend, so the
      // spendable figure above trails the total until it matures.
      hasPendingBalance: hasMaturingIronwoodNotes(account),
      icon: "lock" as const,
    },
  ];
}

function getSelfTransferTarget({
  account,
  transaction,
}: {
  account: AccountLike;
  transaction: unknown;
}): BalanceTypeSelfTransferTarget | null {
  if (!isZcashBasedAccount(account)) return null;

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
  if (!isZcashBasedAccount(account)) return new BigNumber(0);

  if (optionId === PRIVATE) {
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
  getSelectableBalance,
};
