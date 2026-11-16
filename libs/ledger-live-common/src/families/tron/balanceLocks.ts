import type { Account } from "@ledgerhq/types-live";
import type { BalanceLock } from "@domain/entity-account-balance";
import { sumOf, toBalanceLocks } from "../../account/balanceLocks";
import { isTronAccount } from "./types";

/** Frozen (own and delegated) and unfreezing TRX, together what the account page shows as frozen assets. */
export default function tronBalanceLocks(account: Account): BalanceLock[] {
  if (!isTronAccount(account)) return [];
  const { frozen, delegatedFrozen, unFrozen } = account.tronResources;
  return toBalanceLocks([
    [
      "frozen",
      sumOf([
        frozen.bandwidth?.amount,
        frozen.energy?.amount,
        delegatedFrozen.bandwidth?.amount,
        delegatedFrozen.energy?.amount,
      ]),
    ],
    [
      "unbonding",
      sumOf(
        [...(unFrozen.bandwidth ?? []), ...(unFrozen.energy ?? [])].map(({ amount }) => amount),
      ),
    ],
  ]);
}
