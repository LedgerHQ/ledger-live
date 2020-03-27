/* @flow */

import React, { Component } from "react";
import { withNavigation, SafeAreaView } from "react-navigation";
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
import { readOnlyModeEnabledSelector } from "../reducers/settings";

type Props = ModalProps & {
  navigation: *,
  t: T,
  accountsCount: number,
  readOnlyModeEnabled: boolean,
};

const forceInset = { bottom: "always" };

const mapStateToProps = createStructuredSelector({
  readOnlyModeEnabled: readOnlyModeEnabledSelector,
  accountsCount: accountsCountSelector,
});

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

    if (onClose) {
      onClose();
    }
  };

  onSendFunds = () => this.onNavigate("SendFunds", "sendfunds");
  onReceiveFunds = () => this.onNavigate("ReceiveFunds", "receivefunds");
  onExchange = () => this.onNavigate("Transfer", "transfer");

  render() {
    const {
      readOnlyModeEnabled,
      onClose,
      isOpened,
      accountsCount,
      t,
    } = this.props;
    return (
      <BottomModal id="CreateModal" isOpened={isOpened} onClose={onClose}>
        <SafeAreaView forceInset={forceInset}>
          <BottomModalChoice
            event="TransferSend"
            title={t("transfer.send.title")}
            onPress={
              accountsCount > 0 && !readOnlyModeEnabled
                ? this.onSendFunds
                : null
            }
            Icon={IconSend}
          />
          <BottomModalChoice
            event="TransferReceive"
            title={t("transfer.receive.title")}
            onPress={accountsCount > 0 ? this.onReceiveFunds : null}
            Icon={IconReceive}
          />
          <BottomModalChoice
            event="TransferExchange"
            title={t("transfer.exchange.title")}
            Icon={IconExchange}
            onPress={this.onExchange}
          />
        </SafeAreaView>
      </BottomModal>
    );
  }
}

export default translate()(
  withNavigation(connect(mapStateToProps)(CreateModal)),
);
