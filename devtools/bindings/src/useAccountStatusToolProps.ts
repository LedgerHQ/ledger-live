import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import { fetchAccountData } from "@domain/api-account-data";
import { accountsSlice, type AccountsState } from "@domain/entity-account";
import {
  accountDataQueryKey,
  type AccountDataRootState,
  type AccountDataStatus,
} from "@domain/entity-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import {
  accountStatusSlice,
  receiveGate,
  sendGate,
  type AccountGate,
  type AccountStatusState,
  type AssetGate,
} from "@domain/entity-account-status";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";

type AccountStatusToolProps = Extract<DevToolsConfig[number], { id: "account-status" }>["config"];

/** Both apps mount the accounts slice at `accountEntries`. */
type State = AccountDataRootState & {
  accountStatus: AccountStatusState;
  accountEntries: AccountsState;
};

type Dispatch = ThunkDispatch<State, unknown, UnknownAction>;

const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

function describeGate(gate: AccountGate | AssetGate | null): string {
  if (gate === null) return "none";
  if (gate.type === "activation") return `activation · ${gate.method}`;
  return gate.type;
}

const describeRead = (status: AccountDataStatus | undefined) => ({
  reading: status?.request !== undefined,
  error: status?.error && `${status.error.name}: ${status.error.message}`,
  sourceId: status?.sourceId,
  readAt: status?.readAt,
});

export function useAccountStatusToolProps(): AccountStatusToolProps {
  const dispatch = useDispatch<Dispatch>();
  const entries = useSelector(selectAccountEntries);
  const statuses = useSelector(accountStatusSlice.selectSlice);
  const accountReads = useSelector((state: State) => state.accountData.accountStatus);
  const assetReads = useSelector((state: State) => state.accountData.assetStatus);
  // The assets asked per account, so a read that failed or is pending still shows.
  const [asked, setAsked] = useState<Record<string, readonly string[]>>({});

  const descriptors = useMemo(
    () => new Map<string, AccountDescriptor>(entries.map(e => [e.accountUUID, e.descriptor])),
    [entries],
  );
  const descriptorsJson = useMemo(
    () => new Map(entries.map(e => [e.accountUUID, JSON.stringify(e.descriptor, null, 2)])),
    [entries],
  );

  const read = useCallback(
    (descriptor: AccountDescriptor) =>
      dispatch(fetchAccountData("accountStatus", descriptor, { maxAge: 0 })),
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

  const onReadAsset = useCallback(
    (accountUUID: string, assetId: string) => {
      const descriptor = descriptors.get(accountUUID);
      const parsed = CryptoOrTokenCurrencyIdSchema.safeParse(assetId);
      if (!descriptor || !parsed.success) return;
      setAsked(previous => {
        const assets = previous[accountUUID] ?? [];
        return assets.includes(assetId)
          ? previous
          : { ...previous, [accountUUID]: [...assets, assetId] };
      });
      dispatch(
        fetchAccountData("assetStatus", descriptor, {
          query: { assetId: parsed.data },
          maxAge: 0,
        }),
      );
    },
    [descriptors, dispatch],
  );

  const accounts = useMemo(
    () =>
      entries.map(({ accountUUID }) => {
        const stored = statuses[accountUUID];
        const account = stored?.account?.status;
        const storedAssets = new Map(Object.entries(stored?.assets ?? {}));
        const assetIds = [...new Set([...storedAssets.keys(), ...(asked[accountUUID] ?? [])])];
        return {
          accountUUID,
          descriptor: descriptorsJson.get(accountUUID),
          ...describeRead(accountReads?.[accountUUID]?.[accountDataQueryKey(undefined)]),
          used: account?.used,
          gate: account && describeGate(account.gate),
          sendGate: account && describeGate(sendGate(account)),
          assets: assetIds.map(assetId => {
            const asset = storedAssets.get(assetId)?.status;
            return {
              assetId,
              ...describeRead(assetReads?.[accountUUID]?.[accountDataQueryKey({ assetId })]),
              gate: asset && describeGate(asset.gate),
              receiveGate: asset && account && describeGate(receiveGate(account, asset)),
            };
          }),
        };
      }),
    [entries, descriptorsJson, statuses, accountReads, assetReads, asked],
  );

  return { accounts, onRead, onReadAll, onReadAsset };
}
