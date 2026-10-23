import { useCallback, useMemo } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import type { Store, ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import { addAccountDataSource, type AccountDataSource } from "@domain/api-account-data";
import {
  accountsSlice,
  remoteAccountsAdded,
  remoteAccountsRemoved,
  type AccountsState,
} from "@domain/entity-account";
import {
  AccountUUIDSchema,
  computeAccountUUID,
  type AccountDescriptor,
} from "@domain/entity-account-descriptor";
import type { AccountDataRecorder } from "./accountDataRecorder";

type MockAccountsToolProps = Extract<DevToolsConfig[number], { id: "mock-accounts" }>["config"];

/** Both apps mount the accounts slice at `accountEntries`. */
type State = { accountEntries: AccountsState };

const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

/** The tool's source stays added after it unmounts (the Balance tool reads it); a remount replaces it. */
const removers = new WeakMap<Store, () => void>();

/** The recorder, when given, records the calls of the added source like those of the ranked ones. */
export function useMockAccountsToolProps(recorder?: AccountDataRecorder): MockAccountsToolProps {
  const dispatch = useDispatch<ThunkDispatch<State, unknown, UnknownAction>>();
  const store = useStore();
  const entries = useSelector(selectAccountEntries);
  const accounts = useMemo(
    () => entries.filter(({ descriptor }) => descriptor.purpose === "mock"),
    [entries],
  );

  const onAdd = useCallback(
    (descriptors: readonly AccountDescriptor[]) =>
      dispatch(
        remoteAccountsAdded(
          descriptors.map(descriptor => ({
            accountUUID: computeAccountUUID(descriptor),
            descriptor,
          })),
        ),
      ),
    [dispatch],
  );

  const onRemove = useCallback(
    (accountUUIDs: readonly string[]) =>
      dispatch(remoteAccountsRemoved(accountUUIDs.map(id => AccountUUIDSchema.parse(id)))),
    [dispatch],
  );

  const addSource = useCallback(
    (source: AccountDataSource) => {
      const [added] = recorder ? recorder.instrument([source]) : [source];
      removers.get(store)?.();
      removers.set(store, dispatch(addAccountDataSource(added)));
    },
    [dispatch, recorder, store],
  );

  return { accounts, onAdd, onRemove, addSource };
}
