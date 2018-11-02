/* @flow */

import React, { Component } from "react";
import { withNavigation } from "react-navigation";
import { translate } from "react-i18next";

import BottomModal from "../components/BottomModal";
import BottomModalChoice from "../components/BottomModalChoice";
import IconSend from "../icons/Send";
import IconReceive from "../icons/Receive";
import IconExchange from "../icons/Exchange";
import type { T } from "../types/common";

import type { Props as ModalProps } from "../components/BottomModal";

type Props = ModalProps & {
  navigation: *,
  t: T,
};

class CreateModal extends Component<Props> {
  onNavigate = (routeName: string, key: string) => {
    const { navigation, onClose } = this.props;
    navigation.navigate({
      routeName,
      params: {
        goBackKey: navigation.state.key,
      },
      key,
    });
    onClose();
  };

  onSendFunds = () => this.onNavigate("SendFunds", "sendfunds");
  onReceiveFunds = () => this.onNavigate("ReceiveFunds", "receivefunds");
  onExchange = () => this.onNavigate("Transfer", "transfer");

  render() {
    const { onClose, isOpened, t } = this.props;
    return (
      <BottomModal
        isOpened={isOpened}
        onClose={onClose}
        style={{ paddingVertical: 20 }}
      >
        <BottomModalChoice
          title={t("transfer.send.title")}
          description={t("transfer.send.desc")}
          onPress={this.onSendFunds}
          Icon={IconSend}
        />
        <BottomModalChoice
          title={t("transfer.receive.title")}
          description={t("transfer.receive.desc")}
          onPress={this.onReceiveFunds}
          Icon={IconReceive}
        />
        <BottomModalChoice
          title={t("transfer.exchange.title")}
          description={t("transfer.exchange.desc")}
          Icon={IconExchange}
          onPress={this.onExchange}
        />
      </BottomModal>
    );
  }
}

export default translate()(withNavigation(CreateModal));
