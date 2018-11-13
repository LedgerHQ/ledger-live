/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import { connect } from "react-redux";
import { withNavigation } from "react-navigation";

import { removeKnownDevice } from "../../actions/ble";
import { delay } from "../../logic/promise";
import Close from "../../icons/Close";

import BottomModal from "../../components/BottomModal";
import Button from "../../components/Button";
import LText from "../../components/LText";
import Touchable from "../../components/Touchable";
import Space from "../../components/Space";
import { deviceNames } from "../../wording";

import colors from "../../colors";

type Props = {
  navigation: *,
  deviceId: string,
  onClose: () => void,
  opened: boolean,
  removeKnownDevice: string => void,
};

type State = {
  pending: boolean,
  error: ?Error,
};

class DeviceAction extends PureComponent<Props, State> {
  state = {
    pending: true,
    error: null,
  };

  unpair = async () => {
    const { deviceId, navigation, onClose, removeKnownDevice } = this.props;
    removeKnownDevice(deviceId);
    onClose();
    await delay(163);
    navigation.navigate("Manager");
  };

  render() {
    const { onClose, opened } = this.props;

    return (
      <BottomModal isOpened={opened} onClose={onClose}>
        <View style={styles.root}>
          <View style={styles.body}>
            <LText secondary semiBold style={styles.title}>
              <Trans i18nKey="manager.unpair.title" />
            </LText>
            <LText style={styles.description}>
              <Trans
                i18nKey="manager.unpair.description"
                values={deviceNames.nanoX}
              />
            </LText>
          </View>
          <View style={styles.buttons}>
            <Button
              type="secondary"
              onPress={onClose}
              title={<Trans i18nKey="common.cancel" />}
              containerStyle={styles.button}
            />
            <Space w={16} />
            <Button
              type="alert"
              onPress={this.unpair}
              title={<Trans i18nKey="manager.unpair.button" />}
              containerStyle={styles.button}
            />
          </View>
        </View>
        <Touchable style={styles.close} onPress={onClose}>
          <Close color={colors.fog} size={20} />
        </Touchable>
      </BottomModal>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    minHeight: 250,
    paddingHorizontal: 20,
  },
  body: {
    flex: 1,
    flexDirection: "column",
    alignSelf: "center",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 20,
  },
  close: {
    position: "absolute",
    right: 10,
    top: 10,
  },
  headIcon: {
    padding: 10,
    position: "relative",
  },
  title: {
    paddingHorizontal: 40,
    lineHeight: 26,
    fontSize: 16,
    color: colors.darkBlue,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: colors.grey,
    paddingHorizontal: 40,
    textAlign: "center",
  },
  buttons: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
  },
});

export default connect(
  null,
  { removeKnownDevice },
)(withNavigation(DeviceAction));
