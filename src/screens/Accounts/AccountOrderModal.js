/* @flow */

import React, { Component } from "react";
import { Modal, View } from "react-native";
import { withNavigation } from "react-navigation";
import Menu from "../../components/Menu";
import MenuTitle from "../../components/MenuTitle";
import BlueButton from "../../components/BlueButton";
import OrderOption from "./OrderOption";

class AccountOrderModal extends Component<{
  navigation: *,
  onRequestClose: *,
}> {
  render() {
    const { onRequestClose } = this.props;
    return (
      <Modal transparent onRequestClose={onRequestClose}>
        <Menu
          onRequestClose={onRequestClose}
          header={<MenuTitle>Sort by</MenuTitle>}
        >
          <OrderOption id="balance" />
          <OrderOption id="name" />
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <BlueButton onPress={onRequestClose} title="Done" />
          </View>
        </Menu>
      </Modal>
    );
  }
}

export default withNavigation(AccountOrderModal);
