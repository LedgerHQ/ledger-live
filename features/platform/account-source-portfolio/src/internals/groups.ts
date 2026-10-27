import type { BalanceGroup } from "@domain/api-account-portfolio";
import type { PortfolioId } from "@domain/entity-client-identity";
import type { PortfolioClient } from "../client";

/** The most accounts the service puts in a balance page. */
const PAGE_SIZE = 100;
/** Stops a portfolio that keeps handing out pages from reading forever. */
const MAX_PAGES = 50;

/** `truncated`: paging stopped at the cap with pages left, so a missing account may sit past it. */
export type ReadGroups = { groups: Map<string, BalanceGroup>; calls: number; truncated: boolean };

/** The service has no multi-account filter: one filtered call per account, or a scan of every page. */
export async function readBalanceGroups(
  client: PortfolioClient,
  portfolioId: PortfolioId,
  accounts?: ReadonlySet<string>,
): Promise<ReadGroups> {
  const groups = new Map<string, BalanceGroup>();
  if (accounts) {
    const pages = await Promise.all(
      [...accounts].map(account => client.getBalance(portfolioId, { account, size: PAGE_SIZE })),
    );
    pages.flatMap(page => page.items).forEach(group => groups.set(group.account_id, group));
    return { groups, calls: pages.length, truncated: false };
  }
  // Pages follow each other: each one hands out the token of the next.
  const readFrom = async (token: string | undefined, calls: number): Promise<ReadGroups> => {
    const page = await client.getBalance(portfolioId, { size: PAGE_SIZE, token });
    page.items.forEach(group => groups.set(group.account_id, group));
    const next = page.nextToken ?? undefined;
    if (next && calls + 1 < MAX_PAGES) return readFrom(next, calls + 1);
    return { groups, calls: calls + 1, truncated: next !== undefined };
  };
  return readFrom(undefined, 0);
}
