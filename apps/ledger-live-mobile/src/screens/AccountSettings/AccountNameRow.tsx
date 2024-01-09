import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { StyleSheet } from "react-native";
import type { Account } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";
import SettingsRow from "~/components/SettingsRow";
import LText from "~/components/LText";
import type { NavigationProps } from "./index";

type Props = {
  navigation: NavigationProps["navigation"];
  account: Account;
};

class AccountNameRow extends PureComponent<Props> {
  render() {
    const { navigation, account } = this.props;
    return (
      <SettingsRow
        event="AccountNameRow"
        title={<Trans i18nKey="account.settings.accountName.title" />}
        desc={<Trans i18nKey="account.settings.accountName.desc" />}
        arrowRight
        onPress={() =>
          navigation.navigate(ScreenName.EditAccountName, {
            accountId: account.id,
          })
        }
      >
        <LText semiBold numberOfLines={1} style={styles.accountName} color="grey">
          {account.name}
        </LText>
      </SettingsRow>
    );
  }
}

export default AccountNameRow;
const styles = StyleSheet.create({
  accountName: {
    flexShrink: 1,
    textAlign: "right",
  },
});
