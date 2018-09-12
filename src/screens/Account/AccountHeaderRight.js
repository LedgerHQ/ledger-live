/* @flow */
import React, { Component } from "react";
import { View } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import Touchable from "../../components/Touchable";
import Wrench from "../../images/icons/Wrench";
import colors from "../../colors";

type Props = {
  navigation: NavigationScreenProp<*>,
};
class AccountHeaderRight extends Component<Props> {
  render() {
    const { navigation } = this.props;

    return (
      <Touchable
        onPress={() => {
          navigation.navigate("AccountSettings", {
            accountId: navigation.state.params.accountId,
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

export default AccountHeaderRight;
