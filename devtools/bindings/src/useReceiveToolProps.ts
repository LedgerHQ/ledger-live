import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import type { DevToolsConfig } from "@devtools/registry";
import { cryptoAssetsApi } from "@domain/api-currency-token";
import { accountsSlice, type AccountsState } from "@domain/entity-account";
import type { WithAccountBalances } from "@domain/entity-account-balance";
import { currencyIdFromNetwork } from "@domain/entity-account-descriptor";
import { selectAccountNameByUUID, type AccountNamesState } from "@domain/entity-account-name";
import { CRYPTO_CURRENCIES_REGISTRY } from "@domain/entity-currency-crypto";
import { setOverride } from "@shared/feature-flags";
import { useFeature } from "@features/platform-feature-flags";

type ReceiveToolProps = Extract<DevToolsConfig[number], { id: "receive" }>["config"];
type ReceiveToolAsset = ReceiveToolProps["trigger"]["assets"][number];

/** Opening receive is app routing: the host passes its own receive openers. */
export type ReceiveToolTrigger = Omit<ReceiveToolProps["trigger"], "assets">;

type TokenCacheState = Parameters<
  ReturnType<typeof cryptoAssetsApi.endpoints.findTokenById.select>
>[0];

/** Both apps mount the accounts slice at `accountEntries` and the names at `wallet.accountNames`. */
type State = WithAccountBalances &
  TokenCacheState & {
    accountEntries: AccountsState;
    wallet: { accountNames: AccountNamesState };
  };

const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

/** The tokens CAL already resolved, without reading the ones it has not. */
function selectCachedTokens(
  state: State,
): Record<string, { name: string; ticker: string } | undefined> {
  const tokenIds = Object.values(state.accountBalances)
    .flatMap(rows => rows?.map(row => row.assetId) ?? [])
    .filter(assetId => !CRYPTO_CURRENCIES_REGISTRY[assetId]);
  return Object.fromEntries(
    tokenIds.map(id => [id, cryptoAssetsApi.endpoints.findTokenById.select({ id })(state).data]),
  );
}

const NO_FAMILIES: readonly string[] = [];

/** Stable openers that call the host's latest ones, so the host need not memoize its trigger. */
function useLatestTrigger(trigger: ReceiveToolTrigger): ReceiveToolTrigger {
  const latest = useRef(trigger);
  useLayoutEffect(() => {
    latest.current = trigger;
  });
  return useMemo(
    () => ({
      onReceive: target => latest.current.onReceive(target),
      onPickAsset: () => latest.current.onPickAsset(),
      onOpenDeeplink: url => latest.current.onOpenDeeplink(url),
    }),
    [],
  );
}

/** Each account with a legacy id, then each token its balances hold. */
function useReceiveAssets(): readonly ReceiveToolAsset[] {
  const entries = useSelector(selectAccountEntries);
  const accounts = useSelector((state: State) => state.accountEntries);
  const accountNames = useSelector((state: State) => state.wallet.accountNames);
  const balances = useSelector((state: State) => state.accountBalances);
  const tokens = useSelector(selectCachedTokens, shallowEqual);

  return useMemo(
    () =>
      entries.flatMap(({ accountUUID, descriptor, legacyId }) => {
        const currency = CRYPTO_CURRENCIES_REGISTRY[descriptor.network];
        if (!legacyId || !currency) return [];
        const coinId = currencyIdFromNetwork(descriptor.network);
        const name = selectAccountNameByUUID(accountNames, accounts, accountUUID) ?? currency.name;
        const tokenIds = (balances[accountUUID] ?? [])
          .map(row => row.assetId)
          .filter(assetId => assetId !== coinId);
        return [
          {
            id: `${accountUUID}:${coinId}`,
            legacyAccountId: legacyId,
            assetId: coinId,
            label: name,
            ticker: currency.ticker,
            currencyId: coinId,
            network: currency.name,
          },
          ...tokenIds.map(assetId => ({
            id: `${accountUUID}:${assetId}`,
            legacyAccountId: legacyId,
            assetId,
            label: `${tokens[assetId]?.name ?? assetId} · ${name}`,
            ticker: tokens[assetId]?.ticker ?? assetId,
            currencyId: assetId,
            network: currency.name,
            networkId: coinId,
          })),
        ];
      }),
    [entries, accounts, accountNames, balances, tokens],
  );
}

export function useReceiveToolProps(trigger: ReceiveToolTrigger): ReceiveToolProps {
  const dispatch = useDispatch();
  const flag = useFeature("newReceiveFlow");
  const assets = useReceiveAssets();
  const openers = useLatestTrigger(trigger);

  const enabled = !!flag?.enabled;
  const excludedFamilies = flag?.params?.excludedFamilies ?? NO_FAMILIES;

  const setEnabled = useCallback(
    (nextEnabled: boolean) =>
      dispatch(
        setOverride({
          key: "newReceiveFlow",
          value: { enabled: nextEnabled, params: { excludedFamilies: [...excludedFamilies] } },
        }),
      ),
    [dispatch, excludedFamilies],
  );

  const setExcludedFamilies = useCallback(
    (families: readonly string[]) =>
      dispatch(
        setOverride({
          key: "newReceiveFlow",
          value: { enabled, params: { excludedFamilies: [...families] } },
        }),
      ),
    [dispatch, enabled],
  );

  return useMemo(
    () => ({
      flag: { enabled, excludedFamilies, setEnabled, setExcludedFamilies },
      trigger: { ...openers, assets },
    }),
    [enabled, excludedFamilies, setEnabled, setExcludedFamilies, openers, assets],
  );
}
