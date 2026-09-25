export function isCardNotFoundError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "status" in error && error.status === 404;
}

export function isPayCardAccountRead({
  isSignedIn,
  isCardStatusUninitialized,
  isCardStatusFetching,
  cardStatus,
  cardStatusError,
  transactions,
  onboardingStatus,
}: Readonly<{
  isSignedIn: boolean;
  isCardStatusUninitialized: boolean;
  isCardStatusFetching: boolean;
  cardStatus: unknown;
  cardStatusError: unknown;
  transactions: unknown;
  onboardingStatus: unknown;
}>): boolean {
  if (!isSignedIn || isCardStatusUninitialized || isCardStatusFetching) return false;
  if (cardStatus) return transactions !== undefined && onboardingStatus !== undefined;
  return isCardNotFoundError(cardStatusError);
}
