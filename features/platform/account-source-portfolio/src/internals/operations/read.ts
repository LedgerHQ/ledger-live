import type { UpdatesPage } from "@domain/api-account-portfolio";
import type { AccountOperationsQuery } from "@domain/entity-account-operation";
import type { AddressAccountDescriptor } from "@domain/entity-account-descriptor";
import type { PortfolioId } from "@domain/entity-client-identity";
import type { PortfolioClient } from "../../client";
import { serverAccountId } from "../../evm";

const DEFAULT_LIMIT = 20;

/** The query's limit when it is a positive integer, else 20. */
export function limitOf(query: AccountOperationsQuery | undefined): number {
  const requested = query?.limit ?? DEFAULT_LIMIT;
  return Number.isInteger(requested) && requested > 0 ? requested : DEFAULT_LIMIT;
}

/** One page of the account's updates; the cursor is the service's own page token. */
export const readUpdates = (
  client: PortfolioClient,
  portfolioId: () => PortfolioId,
  descriptor: AddressAccountDescriptor,
  { limit, cursor }: { limit: number; cursor?: string },
): Promise<UpdatesPage> =>
  client.getUpdates(portfolioId(), {
    account: serverAccountId(descriptor),
    size: limit,
    token: cursor,
  });
