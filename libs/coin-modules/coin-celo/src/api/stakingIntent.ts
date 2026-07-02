import type {
  BufferTxData,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";

/**
 * The Celo staking operations exposed by the CoinModuleApi.
 *
 * The framework's canonical `StakingOperation` enum can't express Celo's
 * register → lock → vote → activate → revoke → unlock → withdraw choreography, so
 * each operation rides the free-form `TransactionIntent.type` field (mirroring the
 * legacy bridge's `CeloOperationMode`) and maps 1:1 to a single transaction.
 */
export const CELO_STAKING_TYPES = [
  "celo.register",
  "celo.lock",
  "celo.unlock",
  "celo.withdraw",
  "celo.vote",
  "celo.activate",
  "celo.revokePending",
  "celo.revokeActive",
] as const;

export type CeloStakingType = (typeof CELO_STAKING_TYPES)[number];

/**
 * A staking intent for the Celo api.
 *
 * The target validator group for group operations (`vote`/`activate`/`revoke*`)
 * comes from `recipient` (the channel the framework populates for Celo's
 * non-canonical modes), or `valAddress` when a direct caller sets it. `amount`
 * carries the CELO amount for `lock`/`vote`/`unlock`/`revoke*`. `index` optionally
 * selects a specific pending withdrawal for `withdraw` (else the earliest matured).
 */
export type CeloStakingIntent = TransactionIntent<MemoNotSupported, BufferTxData> & {
  type: CeloStakingType;
  valAddress?: string;
  index?: number;
};

const STAKING_TYPE_SET = new Set<string>(CELO_STAKING_TYPES);

/**
 * Narrows a transaction intent to a supported Celo staking intent.
 *
 * Detection keys off the `celo.*` operation carried in `intent.type` — NOT
 * `intentType` — because the generic-coin-framework adapter builds staking
 * intents with `intentType: "transaction"` for modes it doesn't recognize as
 * canonical `StakingOperation`s (Celo's `lock`/`vote`/`activate`/… are not
 * canonical). Keying off the `celo.*` type keeps routing correct whether the
 * intent is built directly or by the framework via `computeIntentType`.
 */
export const isCeloStakingIntent = (
  intent: TransactionIntent<MemoNotSupported, BufferTxData>,
): intent is CeloStakingIntent => STAKING_TYPE_SET.has(intent.type);
