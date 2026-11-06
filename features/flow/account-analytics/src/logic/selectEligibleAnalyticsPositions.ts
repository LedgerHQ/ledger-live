import type { AnalyticsAccountSource, AnalyticsPositionOf } from "../types";

export function selectEligibleAnalyticsPositions<Account extends AnalyticsAccountSource>(
  accounts: readonly Account[],
  blacklistedIds: readonly string[],
  isConfirmed: (operation: Account["operations"][number], account: Account) => boolean,
): readonly AnalyticsPositionOf<Account>[] {
  const excluded = new Set(blacklistedIds);
  const positions: AnalyticsPositionOf<Account>[] = [];
  for (const account of accounts) {
    const tokens = account.subAccounts ?? [];
    const hasConfirmedHistory = [account, ...tokens].some(({ operations }) =>
      operations.some(operation => isConfirmed(operation, account)),
    );
    if (!excluded.has(account.currency.id) && (!account.balance.isZero() || hasConfirmedHistory))
      positions.push({ ...account, subAccounts: undefined });
    for (const token of tokens) {
      const isTokenEligible =
        !token.balance.isZero() ||
        token.operations.some(operation => isConfirmed(operation, account));
      if (!excluded.has(token.token.id) && isTokenEligible) positions.push(token);
    }
  }
  return positions;
}
