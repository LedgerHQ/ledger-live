import type { AccountLike } from "@ledgerhq/types-live";

/** User-supplied name when known, otherwise `currency name + short id`. */
export function accountLabel(account: AccountLike, namesById?: Map<string, string>): string {
  // Token accounts fall back to the parent account's user-supplied name.
  const parentId = account.type === "TokenAccount" ? account.parentId : account.id;
  const userName = namesById?.get(account.id) ?? namesById?.get(parentId);
  if (userName) {
    return account.type === "TokenAccount" ? `${userName} · ${account.token.ticker}` : userName;
  }
  if (account.type === "Account") {
    return `${account.currency.name} ${shortId(account.id)}`;
  }
  return `${account.token.ticker} ${shortId(account.id)}`;
}

/** Collapses a long id into a `start…end` form for compact labels. */
export function shortId(id: string, target = 12): string {
  if (id.length <= target) return id;
  const head = Math.ceil((target - 1) / 2);
  const tail = Math.floor((target - 1) / 2);
  return `${id.slice(0, head)}…${id.slice(id.length - tail)}`;
}
