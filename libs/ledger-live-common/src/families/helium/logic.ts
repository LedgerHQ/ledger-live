import Address from "@helium/address";
import { Validator } from "@helium/http";
import { CryptoCurrency } from "@ledgerhq/cryptoassets";
import { getAccount } from "./api";
import { StakeAction } from "./types";
import { assertUnreachable } from "./utils";

/**
 *
 * @param address
 * @returns true if address is valid
 */
export const isValidAddress = (address: string): boolean => {
  return Address.isValid(address);
};

/**
 *
 * @param address
 * @returns
 */
export const getNonce = async (
  address: string,
  currency: CryptoCurrency
): Promise<number> => {
  const account = await getAccount(address, currency);
  return account.speculativeNonce + 1;
};

export function stakeActions(validator: Validator): StakeAction[] {
  const actions: StakeAction[] = [];

  switch (validator.stakeStatus) {
    case "staked":
      actions.push("unstake", "transfer");
      break;
    case "unstaked":
      break;
    default:
      return assertUnreachable();
  }

  return actions;
}
