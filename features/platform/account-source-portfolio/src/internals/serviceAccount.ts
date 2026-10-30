import type { Portfolio } from "@domain/api-account-portfolio";
import type { AddressAccountDescriptor } from "@domain/entity-account-descriptor";
import { serverAccountId } from "../evm";

export type Unserved = { status: "waiting" | "failed"; detail: string };

/** Why the service cannot answer the account yet; undefined once its account is synchronized. */
export function unservedAccount(
  descriptor: AddressAccountDescriptor,
  portfolio: Portfolio,
): Unserved | undefined {
  const id = serverAccountId(descriptor);
  const accounts = portfolio.accounts ?? [];
  const account = accounts.find(each => each.id === id);
  if (!account) {
    const address = descriptor.address.toLowerCase();
    return accounts.some(each => each.id.endsWith(`:${address}`))
      ? { status: "failed", detail: `The fan-out tracks no ${descriptor.network} account` }
      : { status: "waiting", detail: "Service account not created yet" };
  }
  if (account.status !== "synchronized") {
    return { status: "waiting", detail: `Service account ${account.status}` };
  }
  return undefined;
}
