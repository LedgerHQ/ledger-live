import { resolveAccountIdSelector } from "@domain/entity-account-alias";
import { useSelector } from "LLD/hooks/redux";

/**
 * Turns an `/account/:parentId/:id` route segment back into the account id it aliases.
 * Counterpart of `getAccountUrl`.
 */
export function useAccountIdFromRoute(segment: string | undefined): string | undefined {
  return useSelector(({ accountAliases }) =>
    segment === undefined ? undefined : resolveAccountIdSelector(accountAliases, segment),
  );
}
