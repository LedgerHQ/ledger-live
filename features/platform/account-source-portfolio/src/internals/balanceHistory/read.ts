import type { BalanceHistoryGroup } from "@domain/api-account-portfolio";
import type { BalanceHistoryRange } from "@domain/entity-account-balance-history";
import type { PortfolioId } from "@domain/entity-client-identity";
import type { PortfolioClient } from "../../client";

const PAGE_SIZE = 100;
const MAX_PAGES = 20;

/** `truncated`: the read stopped at its page cap with pages left. */
export type HistoryRead = {
  readonly groups: readonly BalanceHistoryGroup[];
  readonly truncated: boolean;
  readonly calls: number;
};

/** Every page of the account's history over the range, following the service's page token. */
export async function readHistory(
  client: PortfolioClient,
  portfolioId: () => PortfolioId,
  account: string,
  range: BalanceHistoryRange,
): Promise<HistoryRead> {
  const readFrom = async (token: string | undefined, read: HistoryRead): Promise<HistoryRead> => {
    const page = await client.getBalanceHistory(portfolioId(), {
      account,
      range,
      size: PAGE_SIZE,
      token,
    });
    const next = page.nextToken ?? undefined;
    const done: HistoryRead = {
      groups: [...read.groups, ...page.items.filter(group => group.account_id === account)],
      truncated: next !== undefined,
      calls: read.calls + 1,
    };
    return next === undefined || done.calls >= MAX_PAGES ? done : readFrom(next, done);
  };
  return readFrom(undefined, { groups: [], truncated: false, calls: 0 });
}
