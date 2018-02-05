/* @flow */

import React, { Component } from "react";
import { Modal, View, Text, StyleSheet } from "react-native";
import { withNavigation } from "react-navigation";
import Menu from "../components/Menu";
import MenuTitle from "../components/MenuTitle";
import MenuChoice from "../components/MenuChoice";

class CreateModal extends Component<*> {
  onSendFunds = () => {
    const { navigation, onRequestClose } = this.props;
    navigation.navigate("SendFunds", {
      goBackKey: navigation.state.key
    });
    onRequestClose();
  };
  onReceiveFunds = () => {
    const { navigation, onRequestClose } = this.props;
    navigation.navigate("ReceiveFunds", { goBackKey: navigation.state.key });
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

const styles = StyleSheet.create({});

export default withNavigation(CreateModal);
