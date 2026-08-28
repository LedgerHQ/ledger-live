import { deriveEarnTransactionType, type EarnTransactionType } from "./earnTransactionType";
import { deriveDappAction, readDappFunction } from "./dappActions";
import { isStakingApp } from "./stakingApps";
import { getDappSelector, getRawTransactionType, type TransactionLike } from "./transactionShape";

export type ResolvedAction = {
  earnTransactionType?: EarnTransactionType;
  rawTransactionType?: string;
  /**
   * The contract the staking app called. Public infrastructure, identical for every user, and
   * only ever set for a call inside a known staking app — never for a plain send, whose
   * recipient is the user's own payee.
   */
  dappContract?: string;
};

/**
 * The staking action, read from whichever vocabulary the transaction speaks.
 *
 * A family `mode` wins, so EVM chains that stake natively (sei_evm, monad and the rest set a
 * generic-framework mode) keep their own wording and never fall through to call data.
 *
 * Call data is read **only** inside a known staking app. That restriction is the whole gate:
 * a selector names a function, not an intent, so `deposit()` is a vault entry in one contract
 * and an ETH wrap in WETH. Classifying it outside a staking app would count every wrap as an
 * earn deposit. Inside one, the same selector is safe to trust.
 *
 * The two vocabularies stay separate on purpose: a `mode` of `stake` picks a validator and
 * means `delegate`, while a function named `stake` enters a pool and means `deposit`.
 */
export function readAction(
  family: string,
  manifestId: string | undefined,
  transaction: TransactionLike | undefined | null,
): ResolvedAction {
  const mode = getRawTransactionType(transaction);
  const fromMode = deriveEarnTransactionType(family, mode);
  if (fromMode) return { earnTransactionType: fromMode, rawTransactionType: mode };

  if (!isStakingApp(manifestId)) return { rawTransactionType: mode };

  const selector = getDappSelector(transaction);
  if (!selector) return { rawTransactionType: mode };

  // An unmapped function is still reported, by its selector, so the gap is countable and the
  // next mapping is obvious rather than guessed at.
  const called = readDappFunction(selector);
  const recipient = transaction?.recipient;
  return {
    earnTransactionType: deriveDappAction(called),
    rawTransactionType: called,
    // Lower-cased at capture: the same contract reaches us checksum-cased on one route and
    // lower-cased on another, and two spellings would split one contract into two rows.
    ...(typeof recipient === "string" ? { dappContract: recipient.toLowerCase() } : {}),
  };
}
