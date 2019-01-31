// @flow

import React, { PureComponent } from "react";
import Icon from "react-native-vector-icons/dist/Feather";
import IconFa from "react-native-vector-icons/dist/FontAwesome";
import { translate } from "react-i18next";
import Config from "react-native-config";
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";

import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import colors from "../../colors";
import BottomModal from "../../components/BottomModal";
import BottomModalChoice from "../../components/BottomModalChoice";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";

type Props = {
  navigation: NavigationScreenProp<*>,
  isOpened: boolean,
  onClose: () => void,
  readOnlyModeEnabled: boolean,
  t: *,
};

const forceInset = { bottom: "always" };

const IconPlus = () => <Icon name="plus" color={colors.live} size={18} />;
const IconQr = () => <IconFa name="qrcode" color={colors.live} size={18} />;

const mapStateToProps = createStructuredSelector({
  readOnlyModeEnabled: readOnlyModeEnabledSelector,
});

class AddAccountsModal extends PureComponent<Props> {
  onClickAdd = () => {
    this.props.navigation.navigate("AddAccounts");
    this.props.onClose();
  };

  onClickImport = () => {
    this.props.navigation.navigate("ImportAccounts");
    this.props.onClose();
  };

  onClickWSImport = () => {
    this.props.navigation.navigate("DebugWSImport");
    this.props.onClose();
  };

  render() {
    const { readOnlyModeEnabled, isOpened, onClose, t } = this.props;
    return (
      <BottomModal id="AddAccountsModal" isOpened={isOpened} onClose={onClose}>
        <SafeAreaView forceInset={forceInset}>
          {!readOnlyModeEnabled && (
            <BottomModalChoice
              event="AddAccountWithDevice"
              title={t("addAccountsModal.ctaAdd")}
              onPress={this.onClickAdd}
              Icon={IconPlus}
            />
          )}
          <BottomModalChoice
            event="AddAccountWithQR"
            title={t("addAccountsModal.ctaImport")}
            onPress={this.onClickImport}
            Icon={IconQr}
          />
          {Config.EXPERIMENTAL_WS_EXPORT && (
            <BottomModalChoice
              event="AddAccountWithQR"
              title="WS Experimental Import"
              onPress={this.onClickWSImport}
              Icon={IconQr}
            />
          )}
        </SafeAreaView>
      </BottomModal>
    );
  }
}

export default translate()(connect(mapStateToProps)(AddAccountsModal));
