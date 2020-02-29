/* @flow */

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import { connect } from "react-redux";
import { withNavigation, SafeAreaView } from "react-navigation";
import { disconnect } from "@ledgerhq/live-common/lib/hw";
import { getDeviceModel } from "@ledgerhq/devices";
import type { DeviceModelId } from "@ledgerhq/devices";
import { delay } from "@ledgerhq/live-common/lib/promise";

import { removeKnownDevice } from "../../../actions/ble";
import Close from "../../../icons/Close";

import BottomModal from "../../../components/BottomModal";
import Button from "../../../components/Button";
import LText from "../../../components/LText";
import Touchable from "../../../components/Touchable";
import Space from "../../../components/Space";

import colors from "../../../colors";
import Trash from "../../../icons/Trash";

const forceInset = { bottom: "always" };

type Props = {
  navigation: *,
  deviceId: string,
  modelId: DeviceModelId,
  onClose: () => void,
  opened: boolean,
  removeKnownDevice: string => void,
};

type State = {
  pending: boolean,
  error: ?Error,
};

class DeviceRemoveAction extends PureComponent<Props, State> {
  state = {
    pending: true,
    error: null,
  };

  remove = async () => {
    const { deviceId, navigation, onClose, removeKnownDevice } = this.props;
    removeKnownDevice(deviceId);
    onClose();
    await Promise.all([disconnect(deviceId).catch(() => {}), delay(100)]);
    navigation.navigate("Manager");
  };

  render() {
    const { onClose, opened, modelId } = this.props;

    return (
      <BottomModal id="RemoveModal" isOpened={opened} onClose={onClose}>
        <SafeAreaView forceInset={forceInset} style={styles.root}>
          <View style={styles.body}>
            <View style={styles.headIcon}>
              <Trash size={24} color={colors.alert} />
            </View>
            <LText secondary semiBold style={styles.title}>
              <Trans i18nKey="manager.remove.title" />
            </LText>
            <LText style={styles.description}>
              <Trans
                i18nKey="manager.remove.description"
                values={getDeviceModel(modelId)}
              />
            </LText>
          </View>
          <View style={styles.buttons}>
            <Button
              event="ManagerRemoveCancel"
              type="secondary"
              onPress={onClose}
              title={<Trans i18nKey="common.cancel" />}
              containerStyle={styles.button}
            />
            <Space w={16} />
            <Button
              event="ManagerRemoveContinue"
              type="alert"
              onPress={this.remove}
              title={<Trans i18nKey="manager.remove.button" />}
              containerStyle={styles.button}
            />
          </View>
        </SafeAreaView>
        <Touchable
          event="ManagerRemoveClose"
          style={styles.close}
          onPress={onClose}
        >
          <Close color={colors.fog} size={20} />
        </Touchable>
      </BottomModal>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    paddingHorizontal: 20,
  },
  body: {
    flexDirection: "column",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 20,
  },
  close: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  headIcon: {
    padding: 16,
    borderRadius: 50,
    backgroundColor: colors.lightAlert,
  },
  title: {
    paddingVertical: 20,
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
)(withNavigation(DeviceRemoveAction));
