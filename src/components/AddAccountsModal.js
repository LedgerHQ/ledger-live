// @flow

import React, { PureComponent } from "react";
import Icon from "react-native-vector-icons/dist/Feather";
import IconFa from "react-native-vector-icons/dist/FontAwesome";
import { translate } from "react-i18next";
import type { NavigationScreenProp } from "react-navigation";

import colors from "../colors";
import BottomModal from "./BottomModal";
import BottomModalChoice from "./BottomModalChoice";

type Props = {
  navigation: NavigationScreenProp<*>,
  isOpened: boolean,
  onClose: () => void,
  t: *,
};

const IconPlus = () => <Icon name="plus" color={colors.live} size={16} />;
const IconQr = () => <IconFa name="qrcode" color={colors.live} sizse={48} />;

class AddAccountsModal extends PureComponent<Props> {
  onClickAdd = () => {
    this.props.navigation.navigate("AddAccounts");
    this.props.onClose();
  };

  onClickImport = () => {
    this.props.navigation.navigate("ImportAccounts");
    this.props.onClose();
  };

  render() {
    const { isOpened, onClose, t } = this.props;
    return (
      <BottomModal isOpened={isOpened} onClose={onClose}>
        <BottomModalChoice
          title={t("addAccountsModal.ctaAdd")}
          description={t("addAccountsModal.descAdd")}
          onPress={this.onClickAdd}
          Icon={IconPlus}
        />
        <BottomModalChoice
          title={t("addAccountsModal.ctaImport")}
          description={t("addAccountsModal.descImport")}
          onPress={this.onClickImport}
          Icon={IconQr}
        />
      </BottomModal>
    );
  }
}

export default translate()(AddAccountsModal);
