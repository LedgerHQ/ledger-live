import { AccountIdSchema, accountsSlice, type AccountsState } from "@domain/entity-account";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import type { ReceiveTarget } from "../types";

const { selectAccountUUIDByLegacyId, selectAccountEntry } = accountsSlice.getSelectors();

/**
 * Where to receive `assetId`, from the legacy id of a main account (a token account gives its
 * `parentId`); `undefined` until the account model holds the account.
 */
export function toReceiveTarget(
  accounts: AccountsState,
  legacyAccountId: string,
  assetId: CryptoOrTokenCurrencyId,
): ReceiveTarget | undefined {
  const legacyId = AccountIdSchema.safeParse(legacyAccountId);
  if (!legacyId.success) return undefined;
  const accountUUID = selectAccountUUIDByLegacyId(accounts, legacyId.data);
  const entry = accountUUID ? selectAccountEntry(accounts, accountUUID) : undefined;
  return entry && { accountUUID: entry.accountUUID, descriptor: entry.descriptor, assetId };
}
