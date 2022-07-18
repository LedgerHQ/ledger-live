import { decode } from "bech32";

// Address validation freely inspired from
// https://github.com/terra-money/terra.js/blob/9e5f553de3ff3e975eaaf91b1f06e45658b1a5e0/src/core/bech32.ts
function checkPrefixAndLength(
  prefix: string,
  data: string,
  length: number
): boolean {
  try {
    const vals = decode(data);
    return vals.prefix === prefix && data.length == length;
  } catch (e) {
    return false;
  }
}

/**
 * Checks if a string is a valid Osmosis account address.
 *
 * @param addr string to check
 */
export function isValidAddress(currencyPrefix: string, addr: string): boolean {
  return checkPrefixAndLength(currencyPrefix, addr, 43);
}

// export const FIGMENT_OSMOSIS_VALIDATOR_ADDRESS =
//   "osmovaloper1hjct6q7npsspsg3dgvzk3sdf89spmlpf6t4agt";

export const LEDGER_OSMOSIS_VALIDATOR_ADDRESS =
  "osmovaloper17cp6fxccqxrpj4zc00w2c7u6y0umc2jajsyc5t";
