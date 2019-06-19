/* @flow */
import React, { Component } from "react";
import { View } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import type { Account, TokenAccount } from "@ledgerhq/live-common/lib/types";
import { accountAndParentScreenSelector } from "../../reducers/accounts";
import Touchable from "../../components/Touchable";
import Wrench from "../../icons/Wrench";
import colors from "../../colors";

type Props = {
  navigation: NavigationScreenProp<*>,
  account: ?(Account | TokenAccount),
};
class AccountHeaderRight extends Component<Props> {
  render() {
    const { navigation, account } = this.props;
    if (!account || account.type !== "Account") return null;
    return (
      <Touchable
        event="AccountGoSettings"
        onPress={() => {
          navigation.navigate("AccountSettings", {
            accountId: account.id,
          });
        }}
      >
        <View style={{ marginRight: 16 }}>
          <Wrench size={16} color={colors.grey} />
        </View>
      </Touchable>
    );
  }
}

export default connect(accountAndParentScreenSelector)(AccountHeaderRight);
