/* @flow */

import React, { Component } from "react";
import { withNavigation } from "react-navigation";

import type { NavigationScreenProp } from "react-navigation";

import MenuChoice from "../components/MenuChoice";
import BottomModal from "../components/BottomModal";

import type { Props as ModalProps } from "../components/BottomModal";

type Props = ModalProps & {
  navigation: NavigationScreenProp<*>,
};

class CreateModal extends Component<Props> {
  onSendFunds = () => {
    const { navigation, onClose } = this.props;
    navigation.navigate({
      routeName: "SendFunds",
      params: {
        goBackKey: navigation.state.key,
      },
      key: "sendfunds",
    });
    onClose();
  };
  onReceiveFunds = () => {
    const { navigation, onClose } = this.props;
    navigation.navigate({
      routeName: "ReceiveFunds",
      params: { goBackKey: navigation.state.key },
      key: "receiveffunds",
    });
    onClose();
  };
  render() {
    const { onClose, isOpened } = this.props;
    return (
      <BottomModal isOpened={isOpened} onClose={onClose}>
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
      </BottomModal>
    );
  }
}

export default withNavigation(CreateModal);
