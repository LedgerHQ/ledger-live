import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import { fetchAccountData } from "@domain/api-account-data";
import { accountsSlice, type AccountsState } from "@domain/entity-account";
import { accountDataQueryKey, type AccountDataRootState } from "@domain/entity-account-data";
import { currencyIdFromNetwork, type AccountDescriptor } from "@domain/entity-account-descriptor";
import type {
  AccountReceiveQuery,
  ReceiveAddress,
  ReceiveVerification,
  WithAccountReceives,
} from "@domain/entity-account-receive";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";

type AccountReceiveToolProps = Extract<DevToolsConfig[number], { id: "account-receive" }>["config"];
type ToolAsset = AccountReceiveToolProps["accounts"][number]["assets"][number];

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

const nativeOf = (descriptor: AccountDescriptor): string =>
  currencyIdFromNetwork(descriptor.network);

/** The native coin reads with no query, so it shares its stored status with every plain read. */
const queryOf = (descriptor: AccountDescriptor, assetId: string): AccountReceiveQuery | undefined =>
  assetId === nativeOf(descriptor)
    ? undefined
    : { assetId: CryptoOrTokenCurrencyIdSchema.parse(assetId) };

export function useAccountReceiveToolProps({
  deviceVerify,
}: UseAccountReceiveToolPropsOptions = {}): AccountReceiveToolProps {
  const dispatch = useDispatch<Dispatch>();
  const entries = useSelector(selectAccountEntries);
  const receives = useSelector((state: State) => state.accountReceives);
  const statuses = useSelector((state: State) => state.accountData.receive);
  const [tokensRead, setTokensRead] = useState<Readonly<Record<string, readonly string[]>>>({});

  const descriptors = useMemo(
    () => new Map<string, AccountDescriptor>(entries.map(e => [e.accountUUID, e.descriptor])),
    [entries],
  );

  const read = useCallback(
    (descriptor: AccountDescriptor, assetId = nativeOf(descriptor)) =>
      dispatch(
        fetchAccountData("receive", descriptor, {
          maxAge: 0,
          query: queryOf(descriptor, assetId),
        }),
      ),
    [dispatch],
  );

  const onRead = useCallback(
    (accountUUID: string, assetId?: string) => {
      const descriptor = descriptors.get(accountUUID);
      if (!descriptor) return;
      if (assetId && assetId !== nativeOf(descriptor)) {
        setTokensRead(previous =>
          previous[accountUUID]?.includes(assetId)
            ? previous
            : { ...previous, [accountUUID]: [...(previous[accountUUID] ?? []), assetId] },
        );
      }
      read(descriptor, assetId);
    },
    [descriptors, read],
  );

  const onReadAll = useCallback(() => descriptors.forEach(d => read(d)), [descriptors, read]);

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
        const toToolAsset = (assetId: string): ToolAsset => {
          const status =
            statuses?.[accountUUID]?.[accountDataQueryKey(queryOf(descriptor, assetId))];
          const receive =
            receives[accountUUID]?.[CryptoOrTokenCurrencyIdSchema.parse(assetId)]?.receive;
          return {
            assetId,
            reading: status?.request !== undefined,
            error: status?.error && `${status.error.name}: ${status.error.message}`,
            sourceId: status?.sourceId,
            readAt: status?.readAt,
            status: receive?.status,
            receive: receive?.status === "ready" ? toToolAddress(receive, "receive") : undefined,
            shielded:
              receive?.status === "ready" && receive.shielded
                ? toToolAddress(receive.shielded, "shielded")
                : undefined,
          };
        };
        return {
          accountUUID,
          descriptor: JSON.stringify(descriptor, null, 2),
          assets: [nativeOf(descriptor), ...(tokensRead[accountUUID] ?? [])].map(toToolAsset),
        };
      }),
    [entries, statuses, receives, tokensRead, deviceVerify],
  );

  return { accounts, onRead, onReadAll };
}
