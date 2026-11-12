import { AccountIdSchema, accountsSlice } from "@domain/entity-account";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { AccountLike } from "@ledgerhq/types-live";
import type { State } from "~/reducers/types";
import type { ReceiveTarget } from "../types";

type AccountEntriesState = Pick<State, "accountEntries">;

const { selectAccountEntry, selectAccountUUIDByLegacyId } = accountsSlice.getSelectors(
  (state: AccountEntriesState) => state.accountEntries,
);

/** The account model's receive target of a legacy account; `undefined` until the account model holds it. */
export function toReceiveTarget(
  state: AccountEntriesState,
  account: AccountLike,
): ReceiveTarget | undefined {
  const receivingAccountId = account.type === "Account" ? account.id : account.parentId;
  const legacyId = AccountIdSchema.safeParse(receivingAccountId);
  if (!legacyId.success) return undefined;

  const accountUUID = selectAccountUUIDByLegacyId(state, legacyId.data);
  const entry = accountUUID && selectAccountEntry(state, accountUUID);
  if (!entry) return undefined;

  return {
    accountUUID: entry.accountUUID,
    descriptor: entry.descriptor,
    assetId: CryptoOrTokenCurrencyIdSchema.parse(getAccountCurrency(account).id),
  };
}
