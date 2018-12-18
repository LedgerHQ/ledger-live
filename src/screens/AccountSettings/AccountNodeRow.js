/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import SettingsRow from "../../components/SettingsRow";
import { getAccountBridge } from "../../bridge";
import LText from "../../components/LText";
import colors from "../../colors";

type Props = {
  navigation: NavigationScreenProp<*>,
  account: Account,
};

class AccountNodeRow extends PureComponent<Props> {
  render() {
    const { navigation, account } = this.props;
    const bridge = getAccountBridge(account);

    return (
      <SettingsRow
        event="AccountNodeRow"
        title={<Trans i18nKey="account.settings.endpointConfig.title" />}
        desc={<Trans i18nKey="account.settings.endpointConfig.desc" />}
        arrowRight
        alignedTop
        onPress={() =>
          navigation.navigate("EditAccountNode", {
            accountId: account.id,
          })
        }
      >
        <LText
          semiBold
          numberOfLines={1}
          ellipsizeMode="tail"
          style={styles.accountNode}
        >
          {account.endpointConfig ||
            (bridge.getDefaultEndpointConfig &&
              bridge.getDefaultEndpointConfig()) ||
            ""}
        </LText>
      </SettingsRow>
    );
  }
}

export default AccountNodeRow;

const styles = StyleSheet.create({
  accountNode: {
    flexShrink: 1,
    textAlign: "right",
    color: colors.grey,
  },
});
