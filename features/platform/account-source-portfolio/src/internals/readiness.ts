import type { Portfolio } from "@domain/api-account-portfolio";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { portfolioAccountOf } from "../registration";

export type Readiness =
  | { state: "ready"; serverAccountId: string }
  | { state: "pending"; detail: string }
  | { state: "failed"; detail: string };

/** Whether the service can answer the account: ready once its service account is synchronized. */
export function readinessOf(descriptor: AccountDescriptor, portfolio: Portfolio): Readiness {
  const ref = portfolioAccountOf(descriptor);
  if (!ref) return { state: "failed", detail: "Not an account the Portfolio service serves" };
  const { registration, serverAccountId } = ref;
  const accounts = portfolio.accounts ?? [];
  const account = accounts.find(each => each.id === serverAccountId);
  if (!account) {
    const fannedOut =
      registration.type === "evm" &&
      accounts.some(each => each.id.endsWith(`:${registration.address.toLowerCase()}`));
    return fannedOut
      ? { state: "failed", detail: `The fan-out tracks no ${descriptor.network} account` }
      : { state: "pending", detail: "Service account not created yet" };
  }
  if (account.status === "synchronized") return { state: "ready", serverAccountId };
  if (account.status === "registration_failure") {
    return { state: "failed", detail: "Service account registration_failure" };
  }
  return { state: "pending", detail: `Service account ${account.status}` };
}

/** A read the source could not answer: an error the UI shows, never a hand-off to another source. */
export class PortfolioReadError extends Error {
  override name = "PortfolioReadError";
}

export const failedRead = (detail: string): PromiseRejectedResult => ({
  status: "rejected",
  reason: new PortfolioReadError(`Portfolio: ${detail}`),
});
