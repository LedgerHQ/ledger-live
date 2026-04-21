import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";

type ValidateAddressFunction = (
  address: string,
  parameters: Partial<AddressValidationCurrencyParameters>,
) => Promise<boolean>;

export function getValidateAddress(network: string): ValidateAddressFunction {
  switch (network) {
    case "evm":
      return async (address, params) =>
        (await import("@ledgerhq/coin-evm/logic/validateAddress")).validateAddress(address, params);
    case "stellar":
      return async (address, params) =>
        (
          await import("@ledgerhq/coin-stellar/logic/validateAddress")
        ).validateAddress(address, params);
    case "xrp":
    case "ripple":
      return async (address, params) =>
        (await import("@ledgerhq/coin-xrp/logic/validateAddress")).validateAddress(address, params);
    case "tezos":
      return async (address, params) =>
        (
          await import("@ledgerhq/coin-tezos/logic/validateAddress")
        ).validateAddress(address, params);
    case "solana":
      return async (address, params) =>
        (
          await import("@ledgerhq/coin-solana/logic/validateAddress")
        ).validateAddress(address, params);
    default:
      throw new Error(`No validate address function for network ${network}`);
  }
}
