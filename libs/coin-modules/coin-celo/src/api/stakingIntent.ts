import type {
  BufferTxData,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";

/**
 * The Celo staking operations exposed by the CoinModuleApi.
 *
 * The framework's canonical `StakingOperation` enum (`delegate`/`undelegate`/…)
 * cannot express Celo's multi-contract choreography (register → lock → vote →
 * activate → revoke → unlock → withdraw): it has no `activate`/`lock`/`register`
 * member, and `withdraw`/`revoke` need per-position specifics. We therefore carry
 * the operation on the free-form `TransactionIntent.type` field — the same escape
 * hatch coin-solana uses (`stake.delegate`, …) — mirroring the legacy Celo bridge's
 * `CeloOperationMode`. Each maps 1:1 to a single on-chain transaction.
 *
 * See `src/api/STAKING.md`.
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
 * `valAddress` (the framework's validator field) carries the target validator
 * group for group operations (`vote`/`activate`/`revoke*`); `recipient` is
 * accepted as a fallback. `amount` carries the CELO amount for `lock`/`vote`/
 * `unlock`/`revoke*`. The `withdraw` index is derived from on-chain reads.
 */
export type CeloStakingIntent = TransactionIntent<MemoNotSupported, BufferTxData> & {
  intentType: "staking";
  type: CeloStakingType;
  valAddress?: string;
};

const STAKING_TYPE_SET = new Set<string>(CELO_STAKING_TYPES);

/** Narrows a transaction intent to a supported Celo staking intent. */
export const isCeloStakingIntent = (
  intent: TransactionIntent<MemoNotSupported, BufferTxData>,
): intent is CeloStakingIntent =>
  intent.intentType === "staking" && STAKING_TYPE_SET.has(intent.type);
