import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { accountPersistedStateChanged } from "@ledgerhq/live-common/account/index";
import { defineAccountsRecord } from "@features/platform-persistence-accounts";
import { initAccountsActions } from "~/actions/accounts";
import accountModel from "~/logic/accountModel";
import { accountUserDataExportSelector } from "~/reducers/wallet";
import type { State } from "~/reducers/types";

type AccountsState = Pick<State, "accounts" | "wallet">;

/** As `importStore` today (LIVE-40516): decode at version 0, so all the mobile steps run. */
const READ_VERSION = 0;
/** As `saveAccounts` today. */
const WRITTEN_VERSION = 1;

export const accountsRecord = defineAccountsRecord({
  codec: {
    // The envelope schema checks only id and currencyId; the account model reads the rest.
    decode: ({ data }) =>
      accountModel.decode({ data: data as unknown as AccountRaw, version: READ_VERSION }),
    decodedId: ([account]) => account.id,
    encode: async (account: Account, state: AccountsState) => {
      const userData = accountUserDataExportSelector(state.wallet, { account });
      const { data } = await accountModel.encode([account, userData]);
      return { data, version: WRITTEN_VERSION };
    },
  },
  state: {
    select: (state: AccountsState) => state.accounts.active,
    changed: accountPersistedStateChanged,
    toHydrationActions: initAccountsActions,
  },
});
