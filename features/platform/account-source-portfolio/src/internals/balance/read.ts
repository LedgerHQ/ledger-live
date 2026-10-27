import type { BalanceGroup, BalancePage } from "@domain/api-account-portfolio";
import type { PortfolioId } from "@domain/entity-client-identity";
import type { PortfolioClient } from "../../client";

/** Up to this many accounts, one filtered call each beats paging through the whole portfolio. */
const FILTERED_READS_UP_TO = 3;
const PAGE_SIZE = 100;
const MAX_PAGES = 50;

/** `truncated`: the scan stopped at its page cap with pages left. */
export type BalanceRead = {
  readonly groups: ReadonlyMap<string, BalanceGroup>;
  readonly truncated: boolean;
  readonly calls: number;
};

export async function readBalanceGroups(
  client: PortfolioClient,
  portfolioId: () => PortfolioId,
  serverIds: readonly string[],
): Promise<BalanceRead> {
  const groups = new Map<string, BalanceGroup>();
  const keep = (page: BalancePage) =>
    page.items.forEach(group => groups.set(group.account_id, group));
  if (serverIds.length <= FILTERED_READS_UP_TO) {
    const pages = await Promise.all(
      serverIds.map(account => client.getBalance(portfolioId(), { account, size: PAGE_SIZE })),
    );
    pages.forEach(keep);
    return { groups, truncated: false, calls: pages.length };
  }
  let calls = 0;
  let token: string | undefined;
  do {
    const page = await client.getBalance(portfolioId(), { size: PAGE_SIZE, token });
    calls += 1;
    keep(page);
    token = page.nextToken ?? undefined;
  } while (token !== undefined && calls < MAX_PAGES);
  return { groups, truncated: token !== undefined, calls };
}
