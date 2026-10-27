import type { Portfolio, PortfolioRegistration } from "@domain/api-account-portfolio";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";

/** How one family of accounts is registered with the Portfolio service. */
export interface PortfolioRegistrationStrategy {
  /** Undefined when the strategy does not cover it: the service rejects a whole body on one bad entry. */
  register(descriptor: AccountDescriptor): PortfolioRegistration | undefined;
  /** The ids the service gave the account, among those the portfolio lists; empty until it creates them. */
  accountIdsOf(descriptor: AccountDescriptor, portfolio: Portfolio): string[];
  /** The service created the registration's accounts, and none on the account's network. */
  isNotServed(descriptor: AccountDescriptor, portfolio: Portfolio): boolean;
}
