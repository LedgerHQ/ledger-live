/**
 * Typhon's transaction builder throws plain `Error`s while selecting inputs and
 * computing change. The relevant messages are:
 *  - "Not enough ADA"
 *  - "Not enough tokens"
 *  - "Tx size limit reached, try spending lesser ADA/Tokens"
 *
 */
export const isRecoverableBuildError = (error: unknown): boolean => {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();

  return (
    message.includes("not enough ada") ||
    message.includes("not enough tokens") ||
    message.includes("tx size limit")
  );
};
