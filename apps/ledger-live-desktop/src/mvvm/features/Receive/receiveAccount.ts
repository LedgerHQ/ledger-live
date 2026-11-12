import { accountsSlice, AccountIdSchema } from "@domain/entity-account";
import {
  currencyIdFromNetwork,
  type AccountDescriptor,
  type AccountUUID,
} from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById, type CryptoCurrency } from "@domain/entity-currency-crypto";
import type { State } from "~/renderer/reducers";

const { selectAccountEntry, selectAccountUUIDByLegacyId } = accountsSlice.getSelectors(
  (state: State) => state.accountEntries,
);

export { selectAccountEntry };

/** The boundary with legacy callers: the account entry behind a legacy main account id. */
export function selectAccountUUIDOfLegacyAccount(
  state: State,
  legacyAccountId: string,
): AccountUUID | undefined {
  const parsed = AccountIdSchema.safeParse(legacyAccountId);
  return parsed.success ? selectAccountUUIDByLegacyId(state, parsed.data) : undefined;
}

/** The coin of the account's network: what its app runs and what its fees are paid in. */
export function networkCurrencyOf(descriptor: AccountDescriptor): CryptoCurrency {
  return getCryptoCurrencyById(currencyIdFromNetwork(descriptor.network));
}
