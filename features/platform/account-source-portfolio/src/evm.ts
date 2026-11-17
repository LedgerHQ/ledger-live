import {
  currencyIdFromNetwork,
  type AccountDescriptor,
  type AddressAccountDescriptor,
} from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { PortfolioFamily } from "./family";

/** Ethereum uses coin type 60, Ethereum Classic 61. */
const EVM_PATH = /^m\/44h\/(?:60|61)h\//;
const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

/** Coin type 60 is not enough: HyperCore shares it with its own family. */
function isEvmNetwork(network: AccountDescriptor["network"]): boolean {
  try {
    return getCryptoCurrencyById(currencyIdFromNetwork(network)).family === "evm";
  } catch {
    return false;
  }
}

export function isEvmAccount(
  descriptor: AccountDescriptor,
): descriptor is AddressAccountDescriptor {
  return (
    descriptor.type === "address" &&
    EVM_PATH.test(descriptor.path) &&
    EVM_ADDRESS.test(descriptor.key) &&
    isEvmNetwork(descriptor.network)
  );
}

/** One `evm` registration per address, which the service fans out to every EVM network as `<network>:<lowercase address>`. */
export const evmFamily: PortfolioFamily = {
  accountOf: descriptor =>
    isEvmAccount(descriptor)
      ? {
          registration: { type: "evm", address: descriptor.key },
          serverAccountId: `${descriptor.network}:${descriptor.key.toLowerCase()}`,
        }
      : undefined,
  keyOf: ({ type, address }) =>
    type === "evm" && address ? `evm:${address.toLowerCase()}` : undefined,
};
