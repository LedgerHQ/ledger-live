/* @flow */
import React, { PureComponent, Fragment } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { createStructuredSelector } from "reselect";
import colors from "../../../colors";
import { withReboot } from "../../../context/Reboot";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";
import Trash from "../../../images/icons/Trash";
import ModalBottomAction from "../../../components/ModalBottomAction";
import BottomModal from "../../../components/BottomModal";
import RedButton from "../../../components/RedButton";
import GreyButton from "../../../components/GreyButton";
import Circle from "../../../components/Circle";

const mapStateToProps = createStructuredSelector({});

type Props = {
  t: T,
  reboot: (?boolean) => *,
};

type State = {
  isModalOpened: boolean,
};
class HardResetRow extends PureComponent<Props, State> {
  state = {
    isModalOpened: false,
  };

  onRequestClose = () => this.setState({ isModalOpened: false });
  onPress = () => this.setState({ isModalOpened: true });
  onHardReset = () => this.props.reboot(true);

  render() {
    const { t } = this.props;
    const { isModalOpened } = this.state;

    return (
      <Fragment>
        <SettingsRow
          title={t("settings.help.hardReset")}
          titleStyle={{ color: colors.alert }}
          desc={t("settings.help.hardResetDesc")}
          iconLeft={
            <Circle bg="rgba(234,46,73,0.1)" size={32}>
              <Trash size={16} color={colors.alert} />
            </Circle>
          }
          onPress={this.onPress}
        />
        <BottomModal isOpened={isModalOpened} onClose={this.onRequestClose}>
          <ModalBottomAction
            title={null}
            icon={
              <Circle bg={colors.lightAlert} size={56}>
                <Trash size={24} color={colors.alert} />
              </Circle>
            }
            description={t("settings.help.hardResetModalDesc")}
            footer={
              <View style={styles.footerContainer}>
                <GreyButton
                  title={t("common.cancel")}
                  onPress={this.onRequestClose}
                  containerStyle={styles.buttonContainer}
                  titleStyle={styles.buttonTitle}
                />
                <RedButton
                  title={t("settings.help.hardResetModalButton")}
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
        </BottomModal>
      </Fragment>
    );
  }
}

export default compose(
  connect(mapStateToProps),
  translate(),
)(withReboot(HardResetRow));

const styles = StyleSheet.create({
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
