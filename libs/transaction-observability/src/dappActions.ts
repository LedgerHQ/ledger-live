import { DAPP_SELECTORS } from "@ledgerhq/evm-tools/selectors/index";
import type { EarnTransactionType } from "./earnTransactionType";

/**
 * Maps an EVM contract call to a staking action.
 *
 * Deliberately separate from the family maps in `earnTransactionType.ts`, because the two
 * vocabularies disagree on the same words. A generic-coin-framework `mode` of `stake` means
 * `delegate` — a validator is chosen. A selector named `stake` means `deposit` — a pool is
 * entered and there is no validator. Merging them would silently mislabel one of the two.
 *
 * Only unambiguous staking verbs are mapped. Swaps, bridges and everything else fall through,
 * which for an allow-listed app is reported as an unmapped action rather than dropped, so the
 * gap stays visible.
 */
const DAPP_ACTIONS: Record<string, EarnTransactionType> = {
  // Entry. Pooled and liquid staking have no validator to pick, so this is a deposit.
  deposit: "deposit",
  depositeth: "deposit",
  depositall: "deposit",
  // Observed in a Chorus One pooled stake. The map holds both spellings because the selector
  // list really does carry `depositAll` and `deposit_all` as separate functions.
  deposit_all: "deposit",
  depositwithsymbolcheck: "deposit",
  mint: "deposit",
  // Lido's entry point, `submit(address)`.
  submit: "deposit",
  stake: "deposit",
  supply: "deposit",
  // Exit. Not `undelegate`: no validator is involved in a pooled or liquid exit.
  withdraw: "withdraw",
  withdraweth: "withdraw",
  // Counterpart of `deposit_all`, from the same selector list.
  withdraw_all: "withdraw",
  withdrawwithsymbolcheck: "withdraw",
  unstake: "withdraw",
  requestwithdraw: "withdraw",
  requestwithdrawals: "withdraw",
  claimwithdrawal: "withdraw",
  claimwithdrawals: "withdraw",
  // Share-exact exit (ERC-4626), distinct from an amount-exact withdraw.
  redeem: "redeem",
  redeemyield: "redeem",
  // Real on-chain delegation, where a validator is named.
  delegate: "delegate",
  undelegate: "undelegate",
  redelegate: "redelegate",
  claim: "claimReward",
  claimrewards: "claimReward",
  getreward: "claimReward",
};

/**
 * The called function's name, or the raw selector when the map has never seen it.
 *
 * Returning the selector rather than nothing is the point: an allow-listed app calling an
 * unmapped function is reported with the selector as its raw action, so the miss is countable
 * and the next mapping is obvious. Only the four-byte signature hash is used — never the rest
 * of the call data, which carries amounts and addresses.
 */
export function readDappFunction(selector: string): string {
  return DAPP_SELECTORS[selector.toLowerCase()] ?? selector.toLowerCase();
}

/** `undefined` when the call is not a recognised staking action. */
export function deriveDappAction(
  functionName: string | undefined,
): EarnTransactionType | undefined {
  return functionName === undefined ? undefined : DAPP_ACTIONS[functionName.toLowerCase()];
}
