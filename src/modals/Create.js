/* @flow */

import React, { Component } from "react";
import { Modal } from "react-native";
import { withNavigation } from "react-navigation";
import Menu from "../components/Menu";
import MenuTitle from "../components/MenuTitle";
import MenuChoice from "../components/MenuChoice";

class CreateModal extends Component<*> {
  onSendFunds = () => {
    const { navigation, onRequestClose } = this.props;
    navigation.navigate({
      routeName: "SendFunds",
      params: {
        goBackKey: navigation.state.key
      },
      key: "sendfunds"
    });
    onRequestClose();
  };
  onReceiveFunds = () => {
    const { navigation, onRequestClose } = this.props;
    navigation.navigate({
      routeName: "ReceiveFunds",
      params: { goBackKey: navigation.state.key },
      key: "receiveffunds"
    });
    onRequestClose();
  };
  render() {
    const { onRequestClose } = this.props;
    return (
      <Modal transparent onRequestClose={onRequestClose}>
        <Menu
          onRequestClose={onRequestClose}
          header={<MenuTitle>Transfer money</MenuTitle>}
        >
          <MenuChoice
            title="Send funds"
            icon={null}
            description="Lorem ipsum dolor ledger"
            onPress={this.onSendFunds}
          />
          <MenuChoice
            title="Receive funds"
            icon={null}
            description="Lorem ipsum dolor ledger"
            onPress={this.onReceiveFunds}
          />
        </Menu>
      </Modal>
    );
  }
}

export default withNavigation(CreateModal);
