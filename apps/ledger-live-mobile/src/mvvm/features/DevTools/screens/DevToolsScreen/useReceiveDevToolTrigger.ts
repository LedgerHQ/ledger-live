import { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { ReceiveToolTrigger } from "@devtools/bindings";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";
import { accountNameWithDefaultSelector, walletSelector } from "~/reducers/wallet";

export function useReceiveDevToolTrigger(): ReceiveToolTrigger {
  const accounts = useSelector(accountsSelector);
  const walletState = useSelector(walletSelector);
  const { openReceiveForAccount, handleOpenReceiveDrawer } = useOpenReceiveDrawer({
    sourceScreenName: ScreenName.DebugDevTools,
  });

  const entries = useMemo(
    () =>
      accounts.flatMap(parentAccount => [
        { account: parentAccount, parentAccount: undefined },
        ...(parentAccount.subAccounts ?? []).map(account => ({ account, parentAccount })),
      ]),
    [accounts],
  );

  const assets = useMemo(
    () =>
      entries.map(({ account, parentAccount }) => {
        const currency = getAccountCurrency(account);
        return {
          id: account.id,
          label: accountNameWithDefaultSelector(walletState, account),
          ticker: currency.ticker,
          currencyId: currency.id,
          network: (parentAccount?.currency ?? currency).name,
          networkId: parentAccount?.currency.id,
        };
      }),
    [entries, walletState],
  );

  const onReceive = useCallback(
    (accountId: string) => {
      const entry = entries.find(({ account }) => account.id === accountId);
      if (entry) openReceiveForAccount(entry.account, entry.parentAccount);
    },
    [entries, openReceiveForAccount],
  );

  const onPickAsset = useCallback(() => handleOpenReceiveDrawer(), [handleOpenReceiveDrawer]);

  const onOpenDeeplink = useCallback((url: string) => Linking.openURL(url), []);

  return useMemo(
    () => ({ assets, onReceive, onPickAsset, onOpenDeeplink }),
    [assets, onReceive, onPickAsset, onOpenDeeplink],
  );
}
