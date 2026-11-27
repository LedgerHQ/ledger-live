import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Account } from "@ledgerhq/types-live";
import type { AccountSettingsEventHandler } from "@features/flow-account-detail-settings";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { useSelector } from "~/context/hooks";
import { useMaybeAccountName } from "~/reducers/wallet";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { NavigatorName, ScreenName } from "~/const";
import type { AccountDetailNavigatorParamsList } from "../../types";
import { useAccountSettingsTracking } from "../../hooks/useAccountSettingsTracking";
import {
  getManageAssetsAction,
  type AccountDetailNavigation,
} from "../../utils/manageAssetsAction";
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
  onManageAssets: (() => void) | undefined;
  onViewAdvancedLogs: () => void;
  onConfirmRemove: () => void;
  onSettingsEvent: AccountSettingsEventHandler;
}>;

type SettingsScreen = ScreenName.AccountDetailEditName | ScreenName.AccountDetailAdvancedLogs;

type AccountDetailRoute = RouteProp<AccountDetailNavigatorParamsList, ScreenName.AccountDetail>;
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
  const refresh = useAccountRefresh(mainAccount);

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
  const { onSettingsEvent, onSettingsOpened } = useAccountSettingsTracking(mainAccount);
  const onOpenSettings = useCallback(() => {
    onSettingsOpened();
    setIsSettingsOpen(true);
  }, [onSettingsOpened]);
  const onCloseSettings = useCallback(() => setIsSettingsOpen(false), []);
  const actionAfterSettings = useRef<(() => void) | undefined>(undefined);
  const closeSettingsThen = useCallback((action: () => void) => {
    actionAfterSettings.current = action;
    setIsSettingsOpen(false);
  }, []);
  const onSettingsHidden = useCallback(() => {
    const action = actionAfterSettings.current;
    actionAfterSettings.current = undefined;
    action?.();
  }, []);
  const openSettingsScreen = useCallback(
    (screen: SettingsScreen) => {
      closeSettingsThen(() => {
        if (mainAccount) stackNavigation.navigate(screen, { accountId: mainAccount.id });
      });
    },
    [closeSettingsThen, mainAccount, stackNavigation],
  );
  const onChangeName = useCallback(
    () => openSettingsScreen(ScreenName.AccountDetailEditName),
    [openSettingsScreen],
  );
  const onViewAdvancedLogs = useCallback(
    () => openSettingsScreen(ScreenName.AccountDetailAdvancedLogs),
    [openSettingsScreen],
  );

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const onManageAssets = useMemo(() => {
    if (!mainAccount || readOnlyModeEnabled) return undefined;

    const manageAssetsAction = getManageAssetsAction(mainAccount.currency.family);
    if (!manageAssetsAction?.canManage(mainAccount)) return undefined;

    return () => {
      closeSettingsThen(() => manageAssetsAction.open({ account: mainAccount, navigation }));
    };
  }, [closeSettingsThen, mainAccount, navigation, readOnlyModeEnabled]);

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
    onManageAssets,
    onViewAdvancedLogs,
    onConfirmRemove,
    onSettingsEvent,
  };
}
