import { BigNumber } from "bignumber.js";
import type { ZcashAccount } from "../../types/bridge";
import type { SpendableNote, ZcashPrivateInfo } from "../../network/types";
import { ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS } from "../../constants";
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

/**
 * The spendable pool: mature, unreserved Ironwood notes. Note selection
 * (`prepareTransaction`) and max-spendable (`estimateMaxSpendable`) both go
 * through this so a selection and the figure offered as "Max" can never
 * disagree.
 */
export function collectSelectableIronwoodNotes(
  account: SpendabilityAccount,
  reserved: ReadonlySet<string>,
): SpendableNote[] {
  return collectIronwoodNotesWithMaturity(account)
    .filter(({ note, mature }) => mature && !reserved.has(note.nullifier))
    .map(({ note }) => note);
}

/** Sum of the spendable pool -- the figure presented as spendable. */
export function getSpendableIronwoodBalance(
  account: SpendabilityAccount,
  reserved: ReadonlySet<string>,
): BigNumber {
  return collectSelectableIronwoodNotes(account, reserved).reduce(
    (sum, note) => sum.plus(note.amount),
    new BigNumber(0),
  );
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
