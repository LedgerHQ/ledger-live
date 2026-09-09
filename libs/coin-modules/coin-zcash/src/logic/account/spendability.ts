import { BigNumber } from "bignumber.js";
import type { ZcashAccount } from "../../types/bridge";
import type { SpendableNote, ZcashPrivateInfo } from "../../network/types";
import {
  ZCASH_MAX_IRONWOOD_ACTIONS,
  ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS,
} from "../../constants";
import { collectIronwoodSpendableNotes } from "../../bridge/operations";

/**
 * The single funnel every consumer of "what can be spent from the Ironwood
 * pool" goes through: note selection (`prepareTransaction`), max-spendable
 * (`estimateMaxSpendable`), amount validation (`getTransactionStatus`), and the
 * two renderer surfaces that show the spendable Private balance and its
 * maturing-funds warning. Keeping the maturity rule here, once, is what
 * guarantees selection and the presented balance can never disagree.
 */

type SpendabilityAccount = Pick<ZcashAccount, "privateInfo" | "blockHeight">;

/**
 * The height confirmations are counted against: the latest block the shielded
 * scan has processed, falling back to the account's (transparent-sync) block
 * height when the shielded scan has not reported one yet. `null` when neither
 * is known -- callers must then treat no note as mature (fail-closed).
 */
export function resolveReferenceHeight(
  privateInfo: Pick<ZcashPrivateInfo, "lastProcessedBlock"> | undefined | null,
  accountBlockHeight: number | undefined | null,
): number | null {
  return privateInfo?.lastProcessedBlock ?? accountBlockHeight ?? null;
}

/**
 * Whether a note mined at `txBlockHeight` is buried deep enough below
 * `referenceHeight` to have a witness at the builder's anchor (`tip - 10`,
 * `ledger-zcash-utils`). The wallet's delay is two blocks deeper than that
 * anchor lag, which is what keeps a note the wallet calls mature inside the
 * tree at build time even though the anchor is resolved later, at signing.
 *
 * An unknown reference height never grants maturity: the fail-closed case
 * excludes every note rather than guessing.
 */
export function isMatureAtHeight(txBlockHeight: number, referenceHeight: number | null): boolean {
  if (referenceHeight === null) return false;
  return referenceHeight - txBlockHeight >= ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS;
}

type IronwoodNoteMaturity = {
  note: SpendableNote;
  mature: boolean;
};

/**
 * Every raw Ironwood note (`collectIronwoodSpendableNotes`, unfiltered by
 * reservation) paired with whether its enclosing transaction is mature. One
 * pass, shared by every export below, so the maturity filter and the
 * maturing-funds signal can never drift apart.
 */
function collectIronwoodNotesWithMaturity(account: SpendabilityAccount): IronwoodNoteMaturity[] {
  const transactions = account.privateInfo?.transactions ?? [];
  const referenceHeight = resolveReferenceHeight(account.privateInfo, account.blockHeight);
  const blockHeightByTxid = new Map(transactions.map(tx => [tx.id, tx.blockHeight]));

  return collectIronwoodSpendableNotes(transactions).map(note => {
    const txBlockHeight = blockHeightByTxid.get(note.txid);
    return {
      note,
      mature: txBlockHeight !== undefined && isMatureAtHeight(txBlockHeight, referenceHeight),
    };
  });
}

/** Mature, unreserved notes, largest-first, unbounded. Private: callers use
 * either the bounded export below or the shortfall check, never this directly. */
function collectAllSelectableIronwoodNotes(
  account: SpendabilityAccount,
  reserved: ReadonlySet<string>,
): SpendableNote[] {
  return collectIronwoodNotesWithMaturity(account)
    .filter(({ note, mature }) => mature && !reserved.has(note.nullifier))
    .map(({ note }) => note)
    .sort((a, b) => b.amount.comparedTo(a.amount));
}

/**
 * The spendable pool: mature, unreserved Ironwood notes. Note selection
 * (`prepareTransaction`) and max-spendable (`estimateMaxSpendable`) both go
 * through this so a selection and the figure offered as "Max" can never
 * disagree.
 *
 * Bounded to the device's per-PCZT Ironwood action ceiling: N spent notes
 * produce exactly N actions once N >= 2 (the native builder pads to
 * max(2, max(n_spends, n_outputs)), and a send's output count never exceeds
 * 2), so bounding the note count bounds the action count exactly -- no
 * off-by-one.
 *
 * Returned largest-first (see `collectAllSelectableIronwoodNotes`) -- this is
 * now a contract callers may rely on, not an artifact of iteration order.
 */
export function collectSelectableIronwoodNotes(
  account: SpendabilityAccount,
  reserved: ReadonlySet<string>,
): SpendableNote[] {
  return collectAllSelectableIronwoodNotes(account, reserved).slice(0, ZCASH_MAX_IRONWOOD_ACTIONS);
}

/**
 * True when the Ironwood action bound is the reason `totalSpent` cannot be
 * covered -- the account's full spendable pool covers it, only the bounded
 * (device-safe) pool does not. Mirrors `hasBoundedTransparentShortfall`
 * (bridge/statusHelpers.ts) for the shielded pool.
 */
export function hasBoundedIronwoodShortfall(
  account: SpendabilityAccount,
  reserved: ReadonlySet<string>,
  totalSpent: BigNumber,
): boolean {
  const all = collectAllSelectableIronwoodNotes(account, reserved);
  if (all.length <= ZCASH_MAX_IRONWOOD_ACTIONS) return false;
  const boundedTotal = all
    .slice(0, ZCASH_MAX_IRONWOOD_ACTIONS)
    .reduce((sum, n) => sum.plus(n.amount), new BigNumber(0));
  const fullTotal = all.reduce((sum, n) => sum.plus(n.amount), new BigNumber(0));
  return totalSpent.gt(boundedTotal) && totalSpent.lte(fullTotal);
}

/**
 * Sum of the spendable pool -- the figure presented as the account's Private
 * balance (`ZcashTransferFromSelector`, `AccountBalanceSummaryFooter`).
 *
 * Deliberately **unbounded** by the per-PCZT action ceiling: a note past that
 * ceiling is real, owned, mature, unreserved value -- it just cannot be spent
 * in a *single* transaction, which is a fact about one send, not about the
 * account's balance. Reporting less than the true mature total here would
 * make funds silently vanish from the figure a user reads as "what I have",
 * the same failure mode `getMaturingIronwoodBalance` exists to avoid for
 * immature notes. `collectSelectableIronwoodNotes` (bounded) stays the right
 * pool for selection and max-spendable; a send that needs more than the bound
 * covers is caught at that point by `hasBoundedIronwoodShortfall`, not by
 * understating the balance here.
 */
export function getSpendableIronwoodBalance(
  account: SpendabilityAccount,
  reserved: ReadonlySet<string>,
): BigNumber {
  // A sum doesn't care about order, so this filters the maturity pass
  // directly instead of going through collectAllSelectableIronwoodNotes,
  // which sorts largest-first for callers that need a ranked pool -- this
  // renderer-facing path never does.
  return collectIronwoodNotesWithMaturity(account)
    .filter(({ note, mature }) => mature && !reserved.has(note.nullifier))
    .reduce((sum, { note }) => sum.plus(note.amount), new BigNumber(0));
}

/**
 * True once the filter has excluded at least one note for immaturity --
 * incoming notes count exactly as much as change notes. Drives the send-flow
 * warning that spendable may trail total; because it is computed from the
 * same pass as the filter, it can never fire without a note actually having
 * been excluded, nor stay silent while one is.
 */
export function hasMaturingIronwoodNotes(account: SpendabilityAccount): boolean {
  return collectIronwoodNotesWithMaturity(account).some(({ mature }) => !mature);
}

/**
 * Value held by notes that are merely too young to spend.
 *
 * Deliberately **not** `total - spendable`: that difference also swallows the
 * notes an in-flight spend has reserved, and reporting those as "maturing"
 * would tell the user to wait for a confirmation depth when what they are
 * actually waiting on is their own pending transaction. This counts immaturity
 * and nothing else, so the figure always matches the word next to it.
 */
export function getMaturingIronwoodBalance(account: SpendabilityAccount): BigNumber {
  return collectIronwoodNotesWithMaturity(account)
    .filter(({ mature }) => !mature)
    .reduce((sum, { note }) => sum.plus(note.amount), new BigNumber(0));
}
