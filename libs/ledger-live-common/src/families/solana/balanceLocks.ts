import { isStakingAccount, type Account } from "@ledgerhq/types-live";
import type { BalanceLock } from "@domain/entity-account-balance";
import { sumOf, toBalanceLocks } from "../../account/balanceLocks";

/** The unstake fee reserve and the rent-exempt reserve of each stake account. */
export default function solanaBalanceLocks(account: Account): BalanceLock[] {
  if (!isStakingAccount(account)) return [];
  const { actionFeeReserve, delegations, unbondings } = account.stakingResources;
  return toBalanceLocks([
    [
      "reserve",
      sumOf([
        actionFeeReserve,
        ...[...delegations, ...unbondings].map(({ lockedReserve }) => lockedReserve),
      ]),
    ],
  ]);
}
