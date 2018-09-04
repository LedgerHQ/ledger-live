// @flow

import React, { PureComponent } from "react";
import Icon from "react-native-vector-icons/dist/Feather";
import Touchable from "../../components/Touchable";
import colors from "../../colors";
import AccountOrderModal from "./AccountOrderModal";

class AddAccount extends PureComponent<{}, { opened: boolean }> {
  state = {
    opened: false,
  };
  onPress = () => {
    this.setState({ opened: true });
  };
  onRequestClose = () => {
    this.setState({ opened: false });
  };
  render() {
    const { opened } = this.state;
    return (
      <Touchable style={{ marginHorizontal: 16 }} onPress={this.onPress}>
        <Icon name="sliders" color={colors.grey} size={20} />
        {opened ? (
          <AccountOrderModal onRequestClose={this.onRequestClose} />
        ) : null}
      </Touchable>
    );
  }
}

export default AddAccount;
