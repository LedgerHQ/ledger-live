import { useCallback, useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getDefaultAccountName } from "@domain/entity-account-name";
import type { useReceiveToolProps } from "@devtools/bindings";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { openReceiveFlow } from "LLD/features/Receive/openReceiveFlow";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useDeepLinkHandler } from "~/renderer/hooks/useDeeplinking/useDeepLinkHandler";

type ReceiveTrigger = Parameters<typeof useReceiveToolProps>[0];
type Entry = Readonly<{ account: AccountLike; parentAccount?: Account }>;

const SOURCE = "DevTools";

/** Every account and token account, opened through the same `openReceiveFlow` as the product. */
export function useReceiveDevToolTrigger(): ReceiveTrigger {
  const dispatch = useDispatch();
  const accounts = useSelector(accountsSelector);
  const { handler: handleDeeplink } = useDeepLinkHandler();

  const entries = useMemo<readonly Entry[]>(
    () =>
      accounts.flatMap(account => [
        { account },
        ...(account.subAccounts ?? []).map(sub => ({ account: sub, parentAccount: account })),
      ]),
    [accounts],
  );

  const assets = useMemo(
    () =>
      entries.map(({ account, parentAccount }) => {
        const currency = getAccountCurrency(account);
        const mainAccount = parentAccount ?? (account as Account);
        const accountName = getDefaultAccountName(mainAccount);
        return {
          id: account.id,
          label: parentAccount ? `${currency.name} · ${accountName}` : accountName,
          ticker: currency.ticker,
          currencyId: currency.id,
          network: mainAccount.currency.name,
          networkId: parentAccount ? mainAccount.currency.id : undefined,
        };
      }),
    [entries],
  );

  const onReceive = useCallback(
    (assetId: string) => {
      const entry = entries.find(({ account }) => account.id === assetId);
      if (!entry) return;
      dispatch(openReceiveFlow({ ...entry, sourcePage: SOURCE }));
    },
    [dispatch, entries],
  );

  const onPickAsset = useCallback(
    () => dispatch(openReceiveFlow({ sourcePage: SOURCE })),
    [dispatch],
  );

  // Same entry as a link from the OS or an announcement, without leaving the app.
  const onOpenDeeplink = useCallback((url: string) => handleDeeplink(url, false), [handleDeeplink]);

  return useMemo(
    () => ({ assets, onReceive, onPickAsset, onOpenDeeplink }),
    [assets, onReceive, onPickAsset, onOpenDeeplink],
  );
}
