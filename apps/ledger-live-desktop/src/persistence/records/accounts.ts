import { defineAccountsRecord, type StoredAccount } from "@features/platform-persistence-accounts";
import { accountPersistedStateChanged } from "@ledgerhq/live-common/account/index";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import accountModel from "~/helpers/accountModel";
import { initAccountsActions } from "~/renderer/actions/accounts";
import type { State } from "~/renderer/reducers";
import { accountUserDataExportSelector } from "~/renderer/reducers/wallet";

type AccountsState = Pick<State, "accounts" | "wallet">;

/** The legacy desktop read runs no migration step for an account with no version. */
const RUNS_NO_STEP = accountModel.version;

/** The record validates only the envelope; the account model reads the rest of the raw account. */
const asRawModel = ({ data, version }: StoredAccount) => ({
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  data: data as AccountRaw,
  version: version ?? RUNS_NO_STEP,
});

/** The legacy desktop model as is: it migrates from the stored version and writes version 3. */
export const accountsRecord = defineAccountsRecord({
  codec: {
    decode: stored => accountModel.decode(asRawModel(stored)),
    decodedId: ([account]) => account.id,
    encode: (account: Account, state: AccountsState) =>
      accountModel.encode([account, accountUserDataExportSelector(state.wallet, { account })]),
  },
  state: {
    select: (state: AccountsState) => state.accounts,
    changed: accountPersistedStateChanged,
    toHydrationActions: initAccountsActions,
  },
});
