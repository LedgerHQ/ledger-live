import type { SolanaStakeLimits } from "./types";

export type StakeAmountErrorName = "SolanaStakeAccountAmountTooLow" | "NotEnoughBalance";
type StakeAmountError = Error & { name: StakeAmountErrorName };

const STAKE_AMOUNT_ERROR_NAMES = new Set<string>([
  "SolanaStakeAccountAmountTooLow",
  "NotEnoughBalance",
] satisfies StakeAmountErrorName[]);

export function isStakeAmountError(err: unknown): err is StakeAmountError {
  return err instanceof Error && STAKE_AMOUNT_ERROR_NAMES.has(err.name);
}

/**
 * A `stake.createAccount` amount error with the limits it was checked against. Keeps the original
 * error's `name`, so callers matching on it still see `NotEnoughBalance` or
 * `SolanaStakeAccountAmountTooLow`.
 */
export class SolanaStakeAmountError extends Error {
  declare name: StakeAmountErrorName;
  declare readonly cause: StakeAmountError;
  readonly limits: SolanaStakeLimits;

  constructor(cause: StakeAmountError, limits: SolanaStakeLimits, message = cause.message) {
    super(message, { cause });
    this.name = cause.name;
    this.limits = limits;
  }
}
