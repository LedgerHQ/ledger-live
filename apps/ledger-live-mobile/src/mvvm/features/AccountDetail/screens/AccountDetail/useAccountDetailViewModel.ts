import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Account } from "@ledgerhq/types-live";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { useMaybeAccountName } from "~/reducers/wallet";
import { NavigatorName, ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import type { AccountDetailNavigatorParamsList } from "../../types";
import { useAccountRefresh, type AccountRefresh } from "./useAccountRefresh";
import { useDeferredAccountRemoval } from "./useDeferredAccountRemoval";

export type AccountDetailHeader = Readonly<{
  title: string;
  address: string;
  ledgerId: string;
  ticker: string;
}>;

export type AccountDetailViewModel = Readonly<{
  account: Account | undefined;
  accountName: string;
  header: AccountDetailHeader | undefined;
  refresh: AccountRefresh;
  onOpenSettings: () => void;
  isSettingsOpen: boolean;
  onCloseSettings: () => void;
  onSettingsHidden: () => void;
  onChangeName: () => void;
  onViewAdvancedLogs: () => void;
  onConfirmRemove: () => void;
}>;

type SettingsScreen = ScreenName.AccountDetailEditName | ScreenName.AccountDetailAdvancedLogs;

type AccountDetailRoute = RouteProp<AccountDetailNavigatorParamsList, ScreenName.AccountDetail>;
type AccountDetailNavigation = RootNavigationComposite<
  StackNavigatorNavigation<BaseNavigatorStackParamList>
>;
type AccountDetailStackNavigation = NativeStackNavigationProp<
  AccountDetailNavigatorParamsList,
  ScreenName.AccountDetail
>;

export function useAccountDetailViewModel(): AccountDetailViewModel {
  const route = useRoute<AccountDetailRoute>();
  const navigation = useNavigation<AccountDetailNavigation>();
  const stackNavigation = useNavigation<AccountDetailStackNavigation>();
  const { account } = useAccountScreen(route);
  const mainAccount = account?.type === "Account" ? account : undefined;

  const removeAccount = useDeferredAccountRemoval(mainAccount);
  const refresh = useAccountRefresh(mainAccount?.id);

  useEffect(() => {
    if (mainAccount) return;
    navigation.navigate(NavigatorName.Base, {
      screen: NavigatorName.Main,
      params: { screen: NavigatorName.Portfolio, params: { screen: ScreenName.Portfolio } },
    });
  }, [mainAccount, navigation]);

  const accountName = useMaybeAccountName(mainAccount);
  const header = useMemo(
    () =>
      mainAccount && accountName
        ? {
            title: accountName,
            address: formatAddress(mainAccount.freshAddress, { prefixLength: 4, suffixLength: 4 }),
            ledgerId: mainAccount.currency.id,
            ticker: mainAccount.currency.ticker,
          }
        : undefined,
    [mainAccount, accountName],
  );

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const onOpenSettings = useCallback(() => setIsSettingsOpen(true), []);
  const onCloseSettings = useCallback(() => setIsSettingsOpen(false), []);
  const screenToOpenAfterSettings = useRef<SettingsScreen | undefined>(undefined);
  const openSettingsScreen = useCallback((screen: SettingsScreen) => {
    screenToOpenAfterSettings.current = screen;
    setIsSettingsOpen(false);
  }, []);
  const onSettingsHidden = useCallback(() => {
    const screen = screenToOpenAfterSettings.current;
    screenToOpenAfterSettings.current = undefined;
    if (!screen || !mainAccount) return;
    stackNavigation.navigate(screen, { accountId: mainAccount.id });
  }, [mainAccount, stackNavigation]);
  const onChangeName = useCallback(
    () => openSettingsScreen(ScreenName.AccountDetailEditName),
    [openSettingsScreen],
  );
  const onViewAdvancedLogs = useCallback(
    () => openSettingsScreen(ScreenName.AccountDetailAdvancedLogs),
    [openSettingsScreen],
  );

  const onConfirmRemove = useCallback(() => {
    setIsSettingsOpen(false);
    removeAccount();
  }, [removeAccount]);

  return {
    account: mainAccount,
    accountName: accountName ?? "",
    header,
    refresh,
    onOpenSettings,
    isSettingsOpen,
    onCloseSettings,
    onSettingsHidden,
    onChangeName,
    onViewAdvancedLogs,
    onConfirmRemove,
  };
}
