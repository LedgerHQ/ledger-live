import { map, type OperatorFunction } from "rxjs";
import { discoveredAccountsRegistered, type AccountUUID } from "@domain/entity-account";
import { computeAccountUUID } from "@domain/entity-account/descriptor";
import type { DiscoveredAccount } from "./discoverAccounts";
import type { ScannedAccount } from "./scannedAccount";

/** Registers each account found in the `discoveredAccounts` slice, so the account data hooks read it, and hands the UI its `AccountUUID`. Skips registration when `isHeld` already has that UUID (saved accounts rediscovered mid-scan). */
export function registerDiscoveredAccounts(
  dispatch: (action: ReturnType<typeof discoveredAccountsRegistered>) => unknown,
  isHeld: (accountUUID: AccountUUID) => boolean,
): OperatorFunction<DiscoveredAccount, ScannedAccount> {
  return map(({ descriptor, candidate, status }) => {
    const accountUUID = computeAccountUUID(descriptor);
    if (!isHeld(accountUUID)) {
      dispatch(discoveredAccountsRegistered([{ accountUUID, descriptor }]));
    }
    return { accountUUID, candidate, status };
  });
}
