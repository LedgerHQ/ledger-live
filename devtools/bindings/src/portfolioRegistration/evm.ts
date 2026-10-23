import { portfolioNetworkOf } from "@domain/api-account-portfolio";
import { currencyIdFromNetwork } from "@domain/entity-account-descriptor";
import type { PortfolioRegistrationStrategy } from "./types";

/** Ethereum uses coin type 60, Ethereum Classic uses 61. */
const EVM_COIN_TYPE_PATH = /^m\/44h\/(?:60|61)h\//;
const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

/**
 * An EVM account is registered by its address. The coin type alone does not make an account EVM
 * (other chains share it), so the address has to be a 20-byte hexadecimal one too.
 */
export const evmRegistration: PortfolioRegistrationStrategy = {
  register(descriptor) {
    if (descriptor.type !== "address") return undefined;
    if (!EVM_COIN_TYPE_PATH.test(descriptor.path) || !EVM_ADDRESS.test(descriptor.address)) {
      return undefined;
    }
    if (!portfolioNetworkOf(currencyIdFromNetwork(descriptor.network))) return undefined;
    return { type: "evm", address: descriptor.address };
  },
};
