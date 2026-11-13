import {
  NotEnoughBalance,
  NotEnoughBalanceFees,
  NotEnoughBalanceInParentAccount,
  NotEnoughGas,
  NotEnoughSpendableBalance,
} from "@ledgerhq/ledger-wallet-framework/errors";

/** `name` is an instance field on these classes, so it is read off an instance. */
const FAMILY_NOT_ENOUGH_BALANCE_NAMES = [
  "TonNotEnoughBalanceInParentAccount",
  "CardanoNotEnoughFunds",
  "NotEnoughEGLDForFees",
];

const NOT_ENOUGH_BALANCE_NAMES = new Set([
  ...[
    NotEnoughBalance,
    NotEnoughSpendableBalance,
    NotEnoughGas,
    NotEnoughBalanceInParentAccount,
    NotEnoughBalanceFees,
  ].map(ErrorClass => new ErrorClass().name),
  ...FAMILY_NOT_ENOUGH_BALANCE_NAMES,
]);

/**
 * Detects a balance shortfall, including one wrapped in a `CompleteExchangeError`,
 * where the original name lands in `title` or `message`.
 */
export function isNotEnoughBalance(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const { name, title, message } = error as Record<"name" | "title" | "message", unknown>;

  return [name, title, message].some(
    value => typeof value === "string" && NOT_ENOUGH_BALANCE_NAMES.has(value),
  );
}
