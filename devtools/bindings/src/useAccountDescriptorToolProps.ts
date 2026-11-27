import { useAccountRedaction } from "./accountRedaction";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { DevToolsConfig } from "@devtools/registry";
import { accountsSlice, type AccountsState } from "@domain/entity-account";

type AccountDescriptorToolProps = Extract<
  DevToolsConfig[number],
  { id: "account-descriptor" }
>["config"];

/** Both apps mount the accounts slice at `accountEntries`. */
type State = { accountEntries: AccountsState };

const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

export function useAccountDescriptorToolProps(): AccountDescriptorToolProps {
  const redaction = useAccountRedaction();
  const entries = useSelector(selectAccountEntries);
  const accounts = useMemo(
    () =>
      entries.map(({ accountUUID, legacyId, descriptor }) => {
        const { purpose, type, network, path, key } = descriptor;
        return {
          accountUUID,
          legacyId: legacyId && redaction.accountId(legacyId),
          purpose,
          type,
          network,
          path,
          key,
        };
      }),
    [entries, redaction],
  );
  return { accounts };
}
