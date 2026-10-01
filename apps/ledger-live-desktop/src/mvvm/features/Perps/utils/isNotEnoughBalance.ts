import {
  NotEnoughBalance,
  NotEnoughSpendableBalance,
} from "@ledgerhq/ledger-wallet-framework/errors";

/** `name` is an instance field on these classes, so it is read off an instance. */
const NOT_ENOUGH_BALANCE_NAMES = new Set(
  [NotEnoughBalance, NotEnoughSpendableBalance].map(ErrorClass => new ErrorClass().name),
);

/**
 * Tells a balance shortfall apart from other failures. The Exchange app wraps the
 * bridge's validation error in a `CompleteExchangeError` that keeps only its name as
 * the message, so `message` is checked alongside `name`. Duck-typed, as `instanceof`
 * is unreliable here.
 */
export function isNotEnoughBalance(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const { name, message } = error as Record<"name" | "message", unknown>;

  return [name, message].some(
    value => typeof value === "string" && NOT_ENOUGH_BALANCE_NAMES.has(value),
  );
}
