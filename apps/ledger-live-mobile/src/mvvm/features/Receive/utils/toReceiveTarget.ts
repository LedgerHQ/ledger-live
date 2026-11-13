import { findAccountEntryByLegacyId } from "@domain/entity-account";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { AccountLike } from "@ledgerhq/types-live";
import type { State } from "~/reducers/types";
import type { ReceiveTarget } from "../types";

/** The account model's receive target of a legacy account; `undefined` until the account model holds it. */
export function toReceiveTarget(
  state: Pick<State, "accountEntries">,
  account: AccountLike,
): ReceiveTarget | undefined {
  const legacyId = account.type === "Account" ? account.id : account.parentId;
  const entry = findAccountEntryByLegacyId(state.accountEntries, legacyId);
  if (!entry) return undefined;
  const assetId = CryptoOrTokenCurrencyIdSchema.parse(getAccountCurrency(account).id);
  return { accountUUID: entry.accountUUID, descriptor: entry.descriptor, assetId };
}
