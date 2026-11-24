import { AccountIdSchema, accountsSlice, type AccountsState } from "@domain/entity-account";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import type { ReceiveTarget } from "../types";

const { selectAccountUUIDByLegacyId, selectAccountNetwork, selectAccountPath } =
  accountsSlice.getSelectors();

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
  if (!accountUUID) return undefined;
  const network = selectAccountNetwork(accounts, accountUUID);
  const path = selectAccountPath(accounts, accountUUID);
  return network && path && { accountUUID, account: { network, path }, assetId };
}
