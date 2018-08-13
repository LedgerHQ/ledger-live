/* @flow */
import React, { PureComponent, Fragment } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import { View, Modal, StyleSheet } from "react-native";
import { createStructuredSelector } from "reselect";
import colors from "../../../colors";
import { withReboot } from "../../../context/Reboot";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";
import Menu from "../../../components/Menu";
import Trash from "../../../images/icons/Trash";
import ModalBottomAction from "../../../components/ModalBottomAction";
import RedButton from "../../../components/RedButton";
import GreyButton from "../../../components/GreyButton";

const mapStateToProps = createStructuredSelector({});

type Props = {
  t: T,
  reboot: (?boolean) => *,
};

type State = {
  modalOpened: boolean,
};
class HardResetRow extends PureComponent<Props, State> {
  state = {
    modalOpened: false,
  };

  onRequestClose = () => {
    this.setState({ modalOpened: false });
  };

  onPress = () => {
    this.setState({ modalOpened: true });
  };

  onHardReset = () => {
    this.props.reboot(true);
  };
  render() {
    const { t } = this.props;
    const { modalOpened } = this.state;

    return (
      <Fragment>
        <SettingsRow
          title={t("common:settings.help.hardReset")}
          desc={t("common:settings.help.hardResetDesc")}
          arrowRight
          onPress={this.onPress}
        />
        {modalOpened && (
          <Modal transparent onRequestClose={this.onRequestClose}>
            <Menu onRequestClose={this.onRequestClose}>
              <ModalBottomAction
                title={null}
                icon={
                  <View style={styles.imageContainer}>
                    <Trash size={24} color={colors.alert} />
                  </View>
                }
                description={t("common:settings.help.hardResetModalDesc")}
                footer={
                  <View style={styles.footerContainer}>
                    <GreyButton
                      title={t("common:common.cancel")}
                      onPress={this.onRequestClose}
                      containerStyle={styles.buttonContainer}
                      titleStyle={styles.buttonTitle}
                    />
                    <RedButton
                      title={t("common:settings.help.hardResetModalButton")}
                      onPress={this.onHardReset}
                      containerStyle={[
                        styles.buttonContainer,
                        styles.resetButtonBg,
                      ]}
                      titleStyle={[styles.buttonTitle, styles.resetButtonTitle]}
                    />
                  </View>
                }
              />
            </Menu>
          </Modal>
        )}
      </Fragment>
    );
  }
}

export default compose(
  connect(mapStateToProps),
  translate(),
)(withReboot(HardResetRow));

const styles = StyleSheet.create({
  imageContainer: {
    height: 56,
    width: 56,
    borderRadius: 50,
    backgroundColor: colors.lightAlert,
    alignItems: "center",
    justifyContent: "center",
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  buttonContainer: {
    height: 48,
    width: 136,
  },
  resetButtonBg: {
    backgroundColor: colors.alert,
  },
  buttonTitle: {
    fontSize: 16,
  },
  resetButtonTitle: {
    color: colors.white,
  },
});
