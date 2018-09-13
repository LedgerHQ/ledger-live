/* @flow */

import React, { Component } from "react";
import { withNavigation } from "react-navigation";

import type { NavigationScreenProp } from "react-navigation";

import BottomModal from "../components/BottomModal";
import BottomModalChoice from "../components/BottomModalChoice";
import IconSend from "../icons/Send";
import IconReceive from "../icons/Receive";
import IconExchange from "../icons/Exchange";

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
  onExchange = () => {
    console.log(`exchange screen`);
  };
  render() {
    const { onClose, isOpened } = this.props;
    return (
      <BottomModal
        isOpened={isOpened}
        onClose={onClose}
        style={{ paddingVertical: 20 }}
      >
        <BottomModalChoice
          title="Send funds"
          description="Lorem ipsum dolor ledger"
          onPress={this.onSendFunds}
          Icon={IconSend}
        />
        <BottomModalChoice
          title="Receive funds"
          description="Lorem ipsum dolor ledger"
          onPress={this.onReceiveFunds}
          Icon={IconReceive}
        />
        <BottomModalChoice
          title="Exchange"
          description="Lorem ipsum dolor ledger"
          Icon={IconExchange}
          onPress={this.onExchange}
        />
      </BottomModal>
    );
  }
}

export default withNavigation(CreateModal);
