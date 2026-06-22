import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-module-framework/api/index";
import { isValidAddress } from "../logic";

const MAINNET_ID = 1;
const TESTNET_ID = 0;

/**
 * A Cardano address embeds its network tag, so accept it if it parses as a valid address on
 * either network rather than assuming one.
 */
export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  return isValidAddress(address, MAINNET_ID) || isValidAddress(address, TESTNET_ID);
}
