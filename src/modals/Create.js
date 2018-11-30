/* @flow */

import React, { Component } from "react";
import { withNavigation } from "react-navigation";
import { translate } from "react-i18next";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";

import { accountsCountSelector } from "../reducers/accounts";
import IconSend from "../icons/Send";
import IconReceive from "../icons/Receive";
import IconExchange from "../icons/Exchange";
import type { T } from "../types/common";
import BottomModal from "../components/BottomModal";
import BottomModalChoice from "../components/BottomModalChoice";
import type { Props as ModalProps } from "../components/BottomModal";

type Props = ModalProps & {
  navigation: *,
  t: T,
  accountsCount: number,
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
    const { onClose, isOpened, accountsCount, t } = this.props;
    return (
      <BottomModal isOpened={isOpened} onClose={onClose}>
        <BottomModalChoice
          event="TransferSend"
          title={t("transfer.send.title")}
          description={t("transfer.send.desc")}
          onPress={accountsCount > 0 ? this.onSendFunds : null}
          Icon={IconSend}
        />
        <BottomModalChoice
          event="TransferReceive"
          title={t("transfer.receive.title")}
          description={t("transfer.receive.desc")}
          onPress={accountsCount > 0 ? this.onReceiveFunds : null}
          Icon={IconReceive}
        />
        <BottomModalChoice
          event="TransferExchange"
          title={t("transfer.exchange.title")}
          description={t("transfer.exchange.desc")}
          Icon={IconExchange}
          onPress={this.onExchange}
        />
      </BottomModal>
    );
  }
}

export default translate()(
  withNavigation(
    connect(
      createStructuredSelector({
        accountsCount: accountsCountSelector,
      }),
    )(CreateModal),
  ),
);
