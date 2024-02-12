import React from "react";
import { Trans } from "react-i18next";
import type { Account } from "@ledgerhq/types-live";
import { CompositeScreenProps } from "@react-navigation/native";
import { ScreenName } from "~/const";
import SettingsRow from "~/components/SettingsRow";
import { AccountSettingsNavigatorParamList } from "~/components/RootNavigator/types/AccountSettingsNavigator";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type NavigationProps = CompositeScreenProps<
  StackNavigatorProps<AccountSettingsNavigatorParamList, ScreenName.AccountSettingsMain>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

type Props = {
  navigation: NavigationProps["navigation"];
  account: Account;
};

const AccountAdvancedLogsRow = ({ navigation, account }: Props) => {
  return (
    <SettingsRow
      event="AccountAdvancedLogsRow"
      title={<Trans i18nKey="account.settings.advanced.title" />}
      arrowRight
      onPress={() =>
        navigation.navigate(ScreenName.AdvancedLogs, {
          accountId: account.id,
        })
      }
    />
  );
};

export default AccountAdvancedLogsRow;
