import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import { fetchAccountData } from "@domain/api-account-data";
import { accountsSlice, type AccountsState } from "@domain/entity-account";
import { accountDataQueryKey, type AccountDataRootState } from "@domain/entity-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type {
  ReceiveAddress,
  ReceiveVerification,
  WithAccountReceives,
} from "@domain/entity-account-receive";

type AccountReceiveToolProps = Extract<DevToolsConfig[number], { id: "account-receive" }>["config"];

/** Both apps mount the accounts slice at `accountEntries`. */
type State = AccountDataRootState & WithAccountReceives & { accountEntries: AccountsState };

type Dispatch = ThunkDispatch<State, unknown, UnknownAction>;

const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

function describeVerification(verification: ReceiveVerification): string {
  const confirmed =
    verification.type === "publicKey" ? verification.publicKey : verification.address;
  return `${verification.type} at ${verification.path}: ${confirmed}`;
}

export function useAccountReceiveToolProps(): AccountReceiveToolProps {
  const dispatch = useDispatch<Dispatch>();
  const entries = useSelector(selectAccountEntries);
  const receives = useSelector((state: State) => state.accountReceives);
  const statuses = useSelector((state: State) => state.accountData.receive);

  const read = useCallback(
    (descriptor: AccountDescriptor) =>
      dispatch(fetchAccountData("receive", descriptor, { maxAge: 0 })),
    [dispatch],
  );

  const descriptors = useMemo(
    () => new Map<string, AccountDescriptor>(entries.map(e => [e.accountUUID, e.descriptor])),
    [entries],
  );

  const onRead = useCallback(
    (accountUUID: string) => {
      const descriptor = descriptors.get(accountUUID);
      if (descriptor) read(descriptor);
    },
    [descriptors, read],
  );

  const onReadAll = useCallback(() => descriptors.forEach(read), [descriptors, read]);

  const accounts = useMemo(
    () =>
      entries.map(({ accountUUID, descriptor }) => {
        const toToolAddress = ({ address, verification }: ReceiveAddress) => ({
          address,
          verification: verification && describeVerification(verification),
        });
        const status = statuses?.[accountUUID]?.[accountDataQueryKey(undefined)];
        const receive = receives[accountUUID]?.receive;
        return {
          accountUUID,
          descriptor: JSON.stringify(descriptor, null, 2),
          reading: status?.request !== undefined,
          error: status?.error && `${status.error.name}: ${status.error.message}`,
          sourceId: status?.sourceId,
          readAt: status?.readAt,
          receive: receive && toToolAddress(receive),
          shielded: receive?.shielded && toToolAddress(receive.shielded),
        };
      }),
    [entries, statuses, receives],
  );

  return { accounts, onRead, onReadAll };
}
