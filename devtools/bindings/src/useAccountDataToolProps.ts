import { useMemo, useSyncExternalStore } from "react";
import { useSelector } from "react-redux";
import type { DevToolsConfig } from "@devtools/registry";
import { DEFAULT_ACCOUNT_DATA_MAX_AGE } from "@domain/api-account-data";
import { accountsSlice, type AccountsState } from "@domain/entity-account";
import type { AccountDataRootState } from "@domain/entity-account-data";
import type { AccountDataRecorder } from "./accountDataRecorder";

type AccountDataToolProps = Extract<DevToolsConfig[number], { id: "account-data" }>["config"];

/** Both apps mount the accounts slice at `accountEntries`. */
type State = AccountDataRootState & { accountEntries: AccountsState };

const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

export function useAccountDataToolProps(recorder: AccountDataRecorder): AccountDataToolProps {
  const events = useSyncExternalStore(recorder.subscribe, recorder.getEvents);
  const accountData = useSelector((state: State) => state.accountData);
  const entries = useSelector(selectAccountEntries);
  const descriptors = useMemo(
    () =>
      new Map<string, string>(
        entries.map(({ accountUUID, descriptor }) => [
          accountUUID,
          JSON.stringify(descriptor, null, 2),
        ]),
      ),
    [entries],
  );

  const statuses = useMemo(
    () =>
      Object.entries(accountData).flatMap(([kind, byAccount]) =>
        Object.entries(byAccount ?? {}).flatMap(([accountUUID, byQuery]) =>
          Object.entries(byQuery ?? {}).flatMap(([queryKey, status]) =>
            status
              ? [
                  {
                    kind,
                    accountUUID,
                    descriptor: descriptors.get(accountUUID),
                    reading: status.request && (status.request.append ? "next page" : "head"),
                    error: status.error && `${status.error.name}: ${status.error.message}`,
                    sourceId: status.sourceId,
                    queryKey,
                    readAt: status.readAt,
                    hasMore: status.nextCursor !== undefined,
                  } as const,
                ]
              : [],
          ),
        ),
      ),
    [accountData, descriptors],
  );

  return {
    statuses,
    events,
    maxAge: DEFAULT_ACCOUNT_DATA_MAX_AGE,
    onClearEvents: recorder.clear,
  };
}
