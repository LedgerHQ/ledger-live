import React, { useLayoutEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { AccountSettingsSheet } from "@features/flow-account-detail-settings";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { LumenNativeStackNavigationOptions } from "LLM/components/Navigation";
import type { ScreenName } from "~/const";
import type { AccountDetailNavigatorParamsList } from "../../types";
import { AccountDetailView } from "./AccountDetailView";
import { AccountDetailNavBarCenter } from "./components/AccountDetailNavBarCenter";
import { AccountDetailSettingsButton } from "./components/AccountDetailSettingsButton";
import { useAccountDetailViewModel } from "./useAccountDetailViewModel";
import { ACCOUNT_DETAIL_TEST_IDS } from "../../testIds";

type NavigationProps = NativeStackNavigationProp<
  AccountDetailNavigatorParamsList,
  ScreenName.AccountDetail
>;

export default function AccountDetail() {
  const {
    account,
    accountName,
    header,
    refresh,
    onOpenSettings,
    isSettingsOpen,
    onCloseSettings,
    onSettingsHidden,
    onChangeName,
    onViewAdvancedLogs,
    onConfirmRemove,
  } = useAccountDetailViewModel();
  const navigation = useNavigation<NavigationProps>();

  useLayoutEffect(() => {
    if (!header) return;

    const options: Partial<LumenNativeStackNavigationOptions> = {
      title: header.title,
      lumenNavBar: {
        renderCenter: ({ title }) => (
          <AccountDetailNavBarCenter
            title={title}
            address={header.address}
            ledgerId={header.ledgerId}
            ticker={header.ticker}
          />
        ),
        renderTrailing: () => <AccountDetailSettingsButton onPress={onOpenSettings} />,
      },
    };
    navigation.setOptions(options);
  }, [navigation, header, onOpenSettings]);

  if (!account) return null;

  return (
    <>
      <AccountDetailView account={account} refresh={refresh} />
      <AccountSettingsSheet
        isOpen={isSettingsOpen}
        accountName={accountName}
        onClose={onCloseSettings}
        onChangeName={onChangeName}
        onViewAdvancedLogs={onViewAdvancedLogs}
        account={account}
        onConfirmRemove={onConfirmRemove}
        onHidden={onSettingsHidden}
        testID={ACCOUNT_DETAIL_TEST_IDS.settingsSheet}
      />
    </>
  );
}
