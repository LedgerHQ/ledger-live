import { NotEnoughBalance, NotEnoughBalanceFees } from "@ledgerhq/errors";

type ErrorMatcher = {
  pattern: RegExp;
  createError: (match: RegExpMatchArray, cause: Error) => Error;
};

const balanceErrorMatchers: ErrorMatcher[] = [
  {
    // "Balance of gas object 10 is lower than the needed amount: 100"
    pattern: /Balance of gas object \d+ is lower than the needed amount:\s*\d+/i,
    createError: (_match, cause) => new NotEnoughBalanceFees(undefined, undefined, { cause }),
  },
  {
    // "Insufficient balance of 0x2::sui::SUI for owner 0xabc...
    //  Required: 1000, Available: 500"
    pattern: /Insufficient balance of .+ for owner/i,
    createError: (_match, cause) => new NotEnoughBalanceFees(undefined, undefined, { cause }),
  },
  {
    // "Transaction resolution failed: InsufficientCoinBalance in command 0"
    // Thrown by tx.build() when the sender has insufficient coins for the transfer amount.
    // This is a user-amount error (not a gas error); getTransactionStatus handles the display.
    pattern: /InsufficientCoinBalance/i,
    createError: (_match, cause) => new NotEnoughBalance(undefined, undefined, { cause }),
  },
  // Add more patterns here as you discover them
];

/**
 * In order to provide better onward journeys for the users in swap we try to map
 * the errors coming from the Sui SDK dry-run into more specific errors that we can handle in the UI.
 * @param error
 * @returns
 */
export const mapDryRunError = (error: unknown): Error => {
  const message = extractErrorMessage(error);
  const cause = error instanceof Error ? error : new Error(message ?? String(error));
  if (!message) return cause;

  for (const { pattern, createError } of balanceErrorMatchers) {
    const match = message.match(pattern);
    if (match) return createError(match, cause);
  }

  return cause;
};

const extractErrorMessage = (error: unknown): string | undefined => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const { message } = error as { message: unknown };
    return typeof message === "string" ? message : undefined;
  }
  return undefined;
};
