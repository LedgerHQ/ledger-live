import type { Portfolio } from "@domain/api-account-portfolio";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { PortfolioRegistrationStrategy } from "./types";

/** Ethereum uses coin type 60, Ethereum Classic uses 61. */
const EVM_COIN_TYPE_PATH = /^m\/44h\/(?:60|61)h\//;
const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

/** One `evm` registration fans out to every EVM network, as `<network>:<lowercase address>`. */
const fannedOut = (descriptor: AccountDescriptor, portfolio: Portfolio) =>
  descriptor.type === "address"
    ? (portfolio.accounts ?? []).filter(account =>
        account.id.endsWith(`:${descriptor.address.toLowerCase()}`),
      )
    : [];

/** Registered by address: the coin type alone does not make an account EVM, a 0x address does. */
export const evmRegistration: PortfolioRegistrationStrategy = {
  register(descriptor) {
    if (descriptor.type !== "address") return undefined;
    if (!EVM_COIN_TYPE_PATH.test(descriptor.path) || !EVM_ADDRESS.test(descriptor.address)) {
      return undefined;
    }
    return { type: "evm", address: descriptor.address };
  },
  accountIdsOf: (descriptor, portfolio) =>
    fannedOut(descriptor, portfolio)
      .filter(account => account.network === descriptor.network)
      .map(account => account.id),
  isNotServed: (descriptor, portfolio) => {
    const accounts = fannedOut(descriptor, portfolio);
    return accounts.length > 0 && accounts.every(account => account.network !== descriptor.network);
  },
};
