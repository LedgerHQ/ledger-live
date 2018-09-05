// @flow

import React, { PureComponent } from "react";
import { withNavigation } from "react-navigation";
import Icon from "react-native-vector-icons/dist/Feather";
import Touchable from "../../components/Touchable";
import colors from "../../colors";

class AddAccount extends PureComponent<{ navigation: * }> {
  onPress = () => {
    this.props.navigation.navigate("ImportAccounts");
  };
  render() {
    return (
      <Touchable style={{ marginHorizontal: 16 }} onPress={this.onPress}>
        <Icon name="plus" color={colors.grey} size={20} />
      </Touchable>
    );
  }
}

export default withNavigation(AddAccount);
