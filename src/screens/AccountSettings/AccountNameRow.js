/* @flow */
import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import { StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import SettingsRow from "../../components/SettingsRow";
import type { T } from "../../types/common";
import LText from "../../components/LText";
import colors from "../../colors";

type Props = {
  t: T,
  navigation: NavigationScreenProp<*>,
  account: Account,
};

class AccountNameRow extends PureComponent<Props> {
  render() {
    const { t, navigation, account } = this.props;
    return (
      <SettingsRow
        title={t("common:account.settings.accountName.title")}
        desc={t("common:account.settings.accountName.desc")}
        arrowRight
        onPress={() =>
          navigation.navigate("EditAccountName", {
            accountId: account.id,
          })
        }
      >
        <LText
          numberOfLines={1}
          ellipsizeMode="tail"
          style={styles.accountName}
        >
          {account.name}
        </LText>
      </SettingsRow>
    );
  }
}

export default translate()(AccountNameRow);

const styles = StyleSheet.create({
  accountName: {
    flexGrow: 1,
    flexShrink: 1,
    textAlign: "right",
    color: colors.grey,
  },
});
