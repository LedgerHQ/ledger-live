import { AccountIdSchema, accountsSlice } from "@domain/entity-account";
import { useSelector } from "LLD/hooks/redux";
import type { State } from "~/renderer/reducers";

const { selectAccountEntry, selectAccountUUIDByLegacyId } = accountsSlice.getSelectors(
  (state: State) => state.accountEntries,
);

/** Where a screen holding a legacy account crosses over to the entities: its AccountUUID and descriptor. */
export function useLegacyAccountDescriptor(legacyAccountId: string) {
  const accountUUID = useSelector(state => {
    const legacyId = AccountIdSchema.safeParse(legacyAccountId);
    return legacyId.success ? selectAccountUUIDByLegacyId(state, legacyId.data) : undefined;
  });
  const descriptor = useSelector(state =>
    accountUUID ? selectAccountEntry(state, accountUUID)?.descriptor : undefined,
  );
  return { accountUUID, descriptor };
}
