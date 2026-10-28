import type { AccountPortfolioToolAccount } from "../types";

/** A Select value cannot be empty, so "every account" has a value of its own. */
export const ALL_ACCOUNTS = "all";

/** The registrations to send for the chosen account, or for every account. */
export function buildRegistration(
  accounts: readonly AccountPortfolioToolAccount[],
  chosen: string,
) {
  const targets =
    chosen === ALL_ACCOUNTS ? accounts : accounts.filter(a => a.accountUUID === chosen);
  return {
    count: targets.length,
    payload: `[${targets.map(a => a.registration).join(",")}]`,
  };
}
