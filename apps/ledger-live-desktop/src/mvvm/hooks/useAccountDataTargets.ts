import { useMemo } from "react";
import { AccountIdSchema, accountsSlice } from "@domain/entity-account";
import type { AccountDescriptor, AccountUUID } from "@domain/entity-account-descriptor";
import type { Account } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import type { State } from "~/renderer/reducers";

const { selectAccountEntry, selectAccountUUIDByLegacyId } = accountsSlice.getSelectors();

export type AccountDataTarget = {
  account: Account;
  accountUUID: AccountUUID;
  descriptor: AccountDescriptor;
};

export function useAccountDataTargets(rootAccounts: Account[]): AccountDataTarget[] {
  const accountEntries = useSelector((state: State) => state.accountEntries);

  return useMemo(
    () =>
      rootAccounts.flatMap((account): AccountDataTarget[] => {
        const legacyId = AccountIdSchema.safeParse(account.id);
        if (!legacyId.success) return [];
        const accountUUID = selectAccountUUIDByLegacyId(accountEntries, legacyId.data);
        const descriptor = accountUUID
          ? selectAccountEntry(accountEntries, accountUUID)?.descriptor
          : undefined;
        return accountUUID && descriptor ? [{ account, accountUUID, descriptor }] : [];
      }),
    [accountEntries, rootAccounts],
  );
}
