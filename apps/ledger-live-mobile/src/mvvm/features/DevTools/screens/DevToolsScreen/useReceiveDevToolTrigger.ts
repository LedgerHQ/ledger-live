import { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getDefaultAccountName } from "@domain/entity-account-name";
import type { useReceiveToolProps } from "@devtools/bindings";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { useReceiveScreen } from "LLM/features/Receive/hooks/useReceiveScreen";
import { NavigatorName } from "~/const";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";

type ReceiveTrigger = Parameters<typeof useReceiveToolProps>[0];
type Entry = Readonly<{ account: AccountLike; parentAccount?: Account }>;

const SOURCE = "DevTools";

/** Every account and token account, opened through the same routing as the product. */
export function useReceiveDevToolTrigger(): ReceiveTrigger {
  const navigation = useNavigation();
  const accounts = useSelector(accountsSelector);
  const receiveScreen = useReceiveScreen();
  const { handleOpenReceiveDrawer } = useOpenReceiveDrawer({ sourceScreenName: SOURCE });

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
      navigation.navigate(
        NavigatorName.ReceiveFunds,
        receiveScreen({
          accountId: entry.account.id,
          parentId: entry.parentAccount?.id,
          currency: getAccountCurrency(entry.account),
        }),
      );
    },
    [entries, navigation, receiveScreen],
  );

  const onPickAsset = useCallback(() => handleOpenReceiveDrawer(), [handleOpenReceiveDrawer]);

  // The app handles its own scheme, like a link from another app.
  const onOpenDeeplink = useCallback((url: string) => void Linking.openURL(url), []);

  return useMemo(
    () => ({ assets, onReceive, onPickAsset, onOpenDeeplink }),
    [assets, onReceive, onPickAsset, onOpenDeeplink],
  );
}
