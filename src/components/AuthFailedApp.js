/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { translate } from "react-i18next";
import { withReboot } from "../context/Reboot";
import LText from "./LText";
import type { T } from "../types/common";
import colors from "../colors";
import BottomModal from "./BottomModal";
import GreyButton from "./GreyButton";
import BlueButton from "./BlueButton";
import LedgerLiveLogo from "./LedgerLiveLogo";
import LiveLogo from "../icons/LiveLogo";
import HardResetModal from "./HardResetModal";

type Props = {
  t: T,
  reboot: (?boolean) => void,
};
type State = {
  isModalOpened: boolean,
};

class AuthFailedApp extends Component<Props, State> {
  state = {
    isModalOpened: false,
  };

  onRequestClose = () => this.setState({ isModalOpened: false });

  onPress = () => this.setState({ isModalOpened: true });
  onHardReset = () => this.props.reboot(true);
  onSoftReset = () => this.props.reboot();

  render() {
    const { t } = this.props;
    const { isModalOpened } = this.state;
    // temp UI
    return (
      <View style={styles.root}>
        <View style={styles.descriptionContainer}>
          <LedgerLiveLogo
            width={62}
            height={62}
            icon={<LiveLogo size={42} color={colors.live} />}
          />
          <LText semiBold style={styles.title}>
            {t("auth.failed.title")}
          </LText>
        </View>
        <BlueButton
          title={t("auth.failed.buttons.tryAgain")}
          onPress={this.onSoftReset}
          containerStyle={{ height: 48, marginBottom: 10 }}
          titleStyle={styles.buttonTitle}
        />
        <GreyButton
          title={t("auth.failed.buttons.reset")}
          onPress={this.onPress}
          containerStyle={{
            marginTop: 10,
            height: 48,
            backgroundColor: colors.lightGrey,
          }}
          titleStyle={styles.buttonTitle}
        />
        <BottomModal isOpened={isModalOpened} onClose={this.onRequestClose}>
          <HardResetModal
            onRequestClose={this.onRequestClose}
            onHardReset={this.onHardReset}
          />
        </BottomModal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 40,
    justifyContent: "center",
    backgroundColor: colors.lightGrey,
  },
  buttonTitle: {
    fontSize: 16,
  },
  descriptionContainer: {
    marginHorizontal: 16,
    marginVertical: 24,
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 32,
    color: colors.grey,
  },
});

export default translate()(withReboot(AuthFailedApp));
