import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { accountPersistedStateChanged } from "@ledgerhq/live-common/account/index";
import { defineAccountsRecord } from "@features/platform-persistence-accounts";
import { initAccountsActions, migrationVersionOf } from "~/actions/accounts";
import accountModel from "~/logic/accountModel";
import { accountUserDataExportSelector } from "~/reducers/wallet";
import type { State } from "~/reducers/types";

type AccountsState = Pick<State, "accounts" | "wallet">;

export const accountsRecord = defineAccountsRecord({
  codec: {
    // The envelope schema checks only id and currencyId; the account model reads the rest.
    decode: stored =>
      accountModel.decode({
        data: stored.data as unknown as AccountRaw,
        version: migrationVersionOf(stored),
      }),
    decodedId: ([account]) => account.id,
    encode: (account: Account, state: AccountsState) =>
      accountModel.encode([account, accountUserDataExportSelector(state.wallet, { account })]),
  },
  state: {
    select: (state: AccountsState) => state.accounts.active,
    changed: accountPersistedStateChanged,
    toHydrationActions: initAccountsActions,
  },
});
