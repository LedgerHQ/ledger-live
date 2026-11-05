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

/** An address the device is asked to show, `key` naming its outcome for this account, address and verification. */
export type AccountReceiveVerifyRequest = {
  readonly key: string;
  readonly descriptor: AccountDescriptor;
  readonly verification: ReceiveVerification;
  readonly target: "receive" | "shielded";
};

/** The host's device verification, through its Device Intent Executor. */
export type AccountReceiveDeviceVerify = {
  readonly verify: (request: AccountReceiveVerifyRequest) => void;
  /** The last outcome of each request, by its key. */
  readonly outcomes: Readonly<Record<string, string>>;
};

export type UseAccountReceiveToolPropsOptions = {
  /** Absent, the tool offers no device verification. */
  readonly deviceVerify?: AccountReceiveDeviceVerify;
};

const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

const QUERY_KEY = accountDataQueryKey(undefined);

function describeVerification(verification: ReceiveVerification): string {
  switch (verification.type) {
    case "address":
      return `shows ${verification.address} at ${verification.path}`;
    case "addressConfirmation":
      return `confirms ${verification.address} at ${verification.path}`;
    case "publicKey":
      return `confirms key ${verification.publicKey} at ${verification.path}`;
  }
}

export function useAccountReceiveToolProps({
  deviceVerify,
}: UseAccountReceiveToolPropsOptions = {}): AccountReceiveToolProps {
  const dispatch = useDispatch<Dispatch>();
  const entries = useSelector(selectAccountEntries);
  const receives = useSelector((state: State) => state.accountReceives);
  const statuses = useSelector((state: State) => state.accountData.receive);

  const descriptors = useMemo(
    () => new Map<string, AccountDescriptor>(entries.map(e => [e.accountUUID, e.descriptor])),
    [entries],
  );

  const read = useCallback(
    (descriptor: AccountDescriptor) =>
      dispatch(fetchAccountData("receive", descriptor, { maxAge: 0 })),
    [dispatch],
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
        const toToolAddress = (
          { address, verification }: ReceiveAddress,
          target: AccountReceiveVerifyRequest["target"],
        ) => {
          // Names the address verified: a new address read on the account starts without an outcome.
          const key = [
            accountUUID,
            target,
            address,
            verification && JSON.stringify(verification),
          ].join(":");
          return {
            address,
            verification: verification && describeVerification(verification),
            onVerify:
              deviceVerify && verification
                ? () => deviceVerify.verify({ key, descriptor, verification, target })
                : undefined,
            verifyOutcome: deviceVerify?.outcomes[key],
          };
        };
        const status = statuses?.[accountUUID]?.[QUERY_KEY];
        const receive = receives[accountUUID]?.receive;
        return {
          accountUUID,
          descriptor: JSON.stringify(descriptor, null, 2),
          reading: status?.request !== undefined,
          error: status?.error && `${status.error.name}: ${status.error.message}`,
          sourceId: status?.sourceId,
          readAt: status?.readAt,
          receive: receive && toToolAddress(receive, "receive"),
          shielded: receive?.shielded && toToolAddress(receive.shielded, "shielded"),
        };
      }),
    [entries, statuses, receives, deviceVerify],
  );

  return { accounts, onRead, onReadAll };
}
