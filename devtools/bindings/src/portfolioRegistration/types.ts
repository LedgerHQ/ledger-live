import type { PortfolioRegistration } from "@domain/api-account-portfolio";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";

/**
 * How one family of accounts is registered with the Portfolio service. A strategy owns everything
 * the service requires of its family, so supporting a new family means adding a strategy and
 * listing it, with no change to the code that uses them.
 */
export interface PortfolioRegistrationStrategy {
  /**
   * The registration of the account, or undefined when the strategy does not cover it: another
   * family, a network the service does not know, or a value the service would reject. The service
   * validates the whole body, so an entry that may be wrong must not be sent.
   */
  register(descriptor: AccountDescriptor): PortfolioRegistration | undefined;
}
