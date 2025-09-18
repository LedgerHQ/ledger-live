import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { StyleSheet } from "react-native";
import type { Account } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";
import SettingsRow from "~/components/SettingsRow";
import LText from "~/components/LText";
import type { NavigationProps } from "./index";
import { useAccountName } from "~/reducers/wallet";

type Props = {
  navigation: NavigationProps["navigation"];
  account: Account;
};

function AccountNameRow({ navigation, account }: Props) {
  const accountName = useAccountName(account);
  const onPress = useCallback(
    () => navigation.navigate(ScreenName.EditAccountName, { accountId: account.id }),
    [navigation, account.id],
  );
  return (
    <SettingsRow
      event="AccountNameRow"
      title={<Trans i18nKey="account.settings.accountName.title" />}
      desc={<Trans i18nKey="account.settings.accountName.desc" />}
      testID="account-settings-rename-row"
      arrowRight
      onPress={onPress}
    >
      <LText semiBold numberOfLines={1} style={styles.accountName} color="grey">
        {accountName}
      </LText>
    </SettingsRow>
  );
}

export default React.memo(AccountNameRow);

const styles = StyleSheet.create({
  accountName: {
    flexShrink: 1,
    textAlign: "right",
  },
});
