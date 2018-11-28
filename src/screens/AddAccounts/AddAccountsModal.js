// @flow

import React, { PureComponent } from "react";
import Icon from "react-native-vector-icons/dist/Feather";
import IconFa from "react-native-vector-icons/dist/FontAwesome";
import { translate } from "react-i18next";
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";

import colors from "../../colors";
import BottomModal from "../../components/BottomModal";
import BottomModalChoice from "../../components/BottomModalChoice";

type Props = {
  navigation: NavigationScreenProp<*>,
  isOpened: boolean,
  onClose: () => void,
  t: *,
};

const forceInset = { bottom: "always" };

const IconPlus = () => <Icon name="plus" color={colors.live} size={18} />;
const IconQr = () => <IconFa name="qrcode" color={colors.live} size={18} />;

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
        <SafeAreaView forceInset={forceInset}>
          <BottomModalChoice
            title={t("addAccountsModal.ctaAdd")}
            onPress={this.onClickAdd}
            Icon={IconPlus}
          />
          <BottomModalChoice
            title={t("addAccountsModal.ctaImport")}
            onPress={this.onClickImport}
            Icon={IconQr}
          />
        </SafeAreaView>
      </BottomModal>
    );
  }
}

export default translate()(AddAccountsModal);
