import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { COSMOS_MAX_DELEGATIONS } from "../cosmos/logic";
import { DEFAULT_GAS, MIN_GAS_FEE } from "./js-getFeesForTransaction";

const OSMOSIS_MIN_SAFE = new BigNumber(10000); // 10000 uosmo, setting a reasonable floor
const OSMOSIS_MIN_FEES = new BigNumber(MIN_GAS_FEE * DEFAULT_GAS);

export function canDelegate(account: Account): boolean {
  const maxSpendableBalance = getMaxDelegationAvailable(account, 1);
  return maxSpendableBalance.gt(0);
}

export function getMaxDelegationAvailable(
  account: Account,
  validatorsLength: number
): BigNumber {
  const numberOfDelegations = Math.min(
    COSMOS_MAX_DELEGATIONS,
    validatorsLength || 1
  );
  const { spendableBalance } = account;
  return spendableBalance
    .minus(OSMOSIS_MIN_FEES.multipliedBy(numberOfDelegations))
    .minus(OSMOSIS_MIN_SAFE);
}
