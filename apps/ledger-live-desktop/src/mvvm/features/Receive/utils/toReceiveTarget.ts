import { AccountIdSchema, accountsSlice } from "@domain/entity-account";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import type { State } from "~/renderer/reducers";
import type { ReceiveTarget } from "../types";

type AccountEntriesState = Pick<State, "accountEntries">;

const { selectAccountUUIDByLegacyId, selectAccountEntry } = accountsSlice.getSelectors(
  (state: AccountEntriesState) => state.accountEntries,
);

/**
 * Where to receive `assetId`, from the legacy id of a main account (a token account gives its
 * `parentId`); `undefined` until the account model holds the account.
 */
export function toReceiveTarget(
  state: AccountEntriesState,
  legacyAccountId: string,
  assetId: CryptoOrTokenCurrencyId,
): ReceiveTarget | undefined {
  const legacyId = AccountIdSchema.safeParse(legacyAccountId);
  if (!legacyId.success) return undefined;
  const accountUUID = selectAccountUUIDByLegacyId(state, legacyId.data);
  const entry = accountUUID ? selectAccountEntry(state, accountUUID) : undefined;
  return entry && { accountUUID: entry.accountUUID, descriptor: entry.descriptor, assetId };
}
