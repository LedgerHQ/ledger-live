import type { BalanceGroup } from "@domain/api-account-portfolio";
import type { PortfolioClient } from "../client";

/** Below this many accounts, one filtered call per account beats paging through the portfolio. */
const FILTERED_READS_UP_TO = 3;
/** The most accounts the service puts in a balance page. */
const PAGE_SIZE = 100;
/** Stops a portfolio that keeps handing out pages from reading forever. */
const MAX_PAGES = 50;

/** `truncated`: paging stopped at the cap with pages left, so a missing account may sit past it. */
export type ReadGroups = { groups: Map<string, BalanceGroup>; calls: number; truncated: boolean };

/** No multi-account filter: a few accounts are read one by one, more by paging the whole portfolio. */
export async function readBalanceGroups(
  client: PortfolioClient,
  portfolioId: string,
  wanted: ReadonlySet<string>,
): Promise<ReadGroups> {
  const groups = new Map<string, BalanceGroup>();
  if (wanted.size === 0) return { groups, calls: 0, truncated: false };
  if (wanted.size <= FILTERED_READS_UP_TO) {
    const pages = await Promise.all(
      [...wanted].map(account => client.getBalance({ portfolioId, account, size: PAGE_SIZE })),
    );
    pages.flatMap(page => page.items).forEach(group => groups.set(group.account_id, group));
    return { groups, calls: pages.length, truncated: false };
  }
  // Pages follow each other: each one hands out the token of the next.
  const readFrom = async (token: string | undefined, calls: number): Promise<ReadGroups> => {
    const page = await client.getBalance({ portfolioId, size: PAGE_SIZE, token });
    page.items
      .filter(group => wanted.has(group.account_id))
      .forEach(group => groups.set(group.account_id, group));
    const next = page.nextToken ?? undefined;
    const missing = groups.size < wanted.size;
    if (next && missing && calls + 1 < MAX_PAGES) return readFrom(next, calls + 1);
    return { groups, calls: calls + 1, truncated: next !== undefined && missing };
  };
  return readFrom(undefined, 0);
}
