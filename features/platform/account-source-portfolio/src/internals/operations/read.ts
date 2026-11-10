import type { UpdatesPage } from "@domain/api-account-portfolio";
import type { AccountOperationsQuery } from "@domain/entity-account-operation";
import type { PortfolioId } from "@domain/entity-client-identity";
import type { PortfolioClient } from "../../client";

const DEFAULT_LIMIT = 20;

/** The query's limit when it is a positive integer, else 20. */
export function limitOf(query: AccountOperationsQuery | undefined): number {
  const requested = query?.limit ?? DEFAULT_LIMIT;
  return Number.isInteger(requested) && requested > 0 ? requested : DEFAULT_LIMIT;
}

export type UpdatesRequest = { limit: number; cursor?: string };

/** One page of the account's updates; the cursor is the service's own page token. `signal` cancels it. */
export const readUpdates = (
  client: PortfolioClient,
  portfolioId: PortfolioId,
  account: string,
  { limit, cursor }: UpdatesRequest,
  signal?: AbortSignal,
): Promise<UpdatesPage> =>
  client.getUpdates(portfolioId, { account, size: limit, token: cursor }, signal);
