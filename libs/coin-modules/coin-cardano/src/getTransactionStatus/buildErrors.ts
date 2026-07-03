/**
 * Typhon's transaction builder throws plain `Error`s while selecting inputs and
 * computing change. The relevant messages are:
 *  - "Not enough ADA"
 *  - "Not enough tokens"
 *  - "Tx size limit reached, try spending lesser ADA/Tokens"
 *
 * The Send Max builder also throws `CardanoMinAmountError` when the balance, after fees, can't
 * fund an output above the Babbage min-UTXO floor (LIVE-33176) — likewise an amount problem to
 * surface, not a programming error to re-throw. Matched by `name` (not `instanceof`) so it stays
 * robust if the error is re-created across the coin-module-framework boundary.
 */
export const isRecoverableBuildError = (error: unknown): boolean => {
  if ((error as { name?: unknown } | null)?.name === "CardanoMinAmountError") return true;

  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();

  return (
    message.includes("not enough ada") ||
    message.includes("not enough tokens") ||
    message.includes("tx size limit")
  );
};
