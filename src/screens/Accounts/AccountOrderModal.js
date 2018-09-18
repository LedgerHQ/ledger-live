/* @flow */

import React, { Component } from "react";
import { View } from "react-native";
import { withNavigation } from "react-navigation";
import MenuTitle from "../../components/MenuTitle";
import OrderOption from "./OrderOption";
import BottomModal from "../../components/BottomModal";
import BlueButton from "../../components/BlueButton";

class AccountOrderModal extends Component<{
  navigation: *,
  isOpened: boolean,
  onClose: () => void,
}> {
  render() {
    const { onClose, isOpened } = this.props;
    return (
      <BottomModal onClose={onClose} isOpened={isOpened}>
        <MenuTitle>Sort by</MenuTitle>
        <OrderOption id="balance" />
        <OrderOption id="name" />
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <BlueButton
            onPress={onClose}
            title="Done"
            containerStyle={{ height: 48 }}
          />
        </View>
      </BottomModal>
    );
  }
}

export default withNavigation(AccountOrderModal);
