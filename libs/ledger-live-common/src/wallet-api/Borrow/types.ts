/**
 * Shared types for the Borrow live app wallet-api integration.
 *
 * Kept in a dedicated module (instead of co-located with the navigate handler)
 * so that desktop and mobile consumers can import the navigation contract
 * without coupling to the handler implementation file.
 */

export type BorrowSwapNavigationParams = {
  fromCurrencyId?: string;
  toCurrencyId?: string;
  fromTokenId?: string;
  toTokenId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  amountFrom?: string;
  affiliate?: string;
};
