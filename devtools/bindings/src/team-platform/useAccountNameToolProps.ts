import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import type { DevToolsConfig } from "@devtools/registry";
import { AccountIdSchema, accountsSlice, type AccountsState } from "@domain/entity-account";
import { AccountUUIDSchema } from "@domain/entity-account-descriptor";
import {
  getDefaultAccountName,
  selectAccountNameByUUID,
  type AccountForName,
  type AccountNamesState,
} from "@domain/entity-account-name";

type AccountNameToolProps = Extract<DevToolsConfig[number], { id: "account-name" }>["config"];

/** Both apps mount the accounts slice at `accountEntries` and the names at `wallet.accountNames`. */
type State = { accountEntries: AccountsState; wallet: { accountNames: AccountNamesState } };

const { selectAccountUUIDByLegacyId } = accountsSlice.getSelectors();

/** Every legacy account with its name or its default, then the names of accounts not listed. */
export function useAccountNameToolProps(
  legacyAccounts: readonly AccountForName[],
): AccountNameToolProps {
  const accounts = useSelector((state: State) => state.accountEntries);
  const accountNames = useSelector((state: State) => state.wallet.accountNames);

  const names = useMemo(() => {
    const uuidOf = (legacyId: string) => {
      const accountId = AccountIdSchema.safeParse(legacyId);
      return accountId.success ? selectAccountUUIDByLegacyId(accounts, accountId.data) : undefined;
    };
    const listed = new Set(legacyAccounts.map(account => account.id));
    const custom = new Map<string, string>(accountNames);
    return [
      ...legacyAccounts.map(account => {
        const name = custom.get(account.id);
        return {
          legacyId: account.id,
          accountUUID: uuidOf(account.id),
          name: name ?? getDefaultAccountName(account),
          isDefault: name === undefined,
        };
      }),
      ...Array.from(custom)
        .filter(([legacyId]) => !listed.has(legacyId))
        .map(([legacyId, name]) => ({
          legacyId,
          accountUUID: uuidOf(legacyId),
          name,
          isDefault: false,
        })),
    ];
  }, [legacyAccounts, accountNames, accounts]);

  const nameOf = useCallback(
    (accountUUID: string) => {
      const parsed = AccountUUIDSchema.safeParse(accountUUID);
      return parsed.success
        ? selectAccountNameByUUID(accountNames, accounts, parsed.data)
        : undefined;
    },
    [accountNames, accounts],
  );

  return { names, nameOf };
}
