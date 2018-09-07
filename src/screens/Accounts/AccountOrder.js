// @flow

import React, { PureComponent } from "react";
import Icon from "react-native-vector-icons/dist/Feather";
import Touchable from "../../components/Touchable";
import colors from "../../colors";
import AccountOrderModal from "./AccountOrderModal";

class AddAccount extends PureComponent<{}, { isOpened: boolean }> {
  state = {
    isOpened: false,
  };

  onPress = () => this.setState({ isOpened: true });
  onClose = () => this.setState({ isOpened: false });

  render() {
    const { isOpened } = this.state;
    return (
      <Touchable style={{ marginHorizontal: 16 }} onPress={this.onPress}>
        <Icon name="sliders" color={colors.grey} size={20} />
        <AccountOrderModal isOpened={isOpened} onClose={this.onClose} />
      </Touchable>
    );
  }
}

export default AddAccount;
