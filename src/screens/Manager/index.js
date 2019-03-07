/* @flow */
import React, { Component } from "react";
import { View, StyleSheet, Image } from "react-native";
import { withNavigationFocus, ScrollView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { Trans, translate } from "react-i18next";
import i18next from "i18next";
import { compose } from "redux";
import manager from "@ledgerhq/live-common/lib/manager";
import { removeKnownDevice } from "../../actions/ble";
import {
  connectingStep,
  dashboard,
  genuineCheck,
  getDeviceName,
} from "../../components/DeviceJob/steps";
import SelectDevice from "../../components/SelectDevice";
import type { DeviceMeta } from "../../components/DeviceJob/types";
import colors from "../../colors";
import TrackScreen from "../../analytics/TrackScreen";
import { track } from "../../analytics";
import LText from "../../components/LText";
import Button from "../../components/Button";
import type { DeviceLike } from "../../reducers/ble";
import Trash from "../../icons/Trash";
import BottomModal from "../../components/BottomModal";
import ModalBottomAction from "../../components/ModalBottomAction";

const UnpairDeviceModal = ({
  onHideMenu,
  unPair,
  open,
  deviceName,
}: {
  onHideMenu: () => *,
  unPair: () => *,
  open: boolean,
  deviceName: string,
}) => (
  <BottomModal id="DeviceItemModal" isOpened={open} onClose={onHideMenu}>
    <ModalBottomAction
      title={deviceName}
      footer={
        <View style={styles.footerContainer}>
          <Button
            event="HardResetModalAction"
            type="alert"
            IconLeft={Trash}
            title={<Trans i18nKey="common.forgetDevice" />}
            onPress={unPair}
            containerStyle={styles.buttonContainer}
          />
        </View>
      }
    />
  </BottomModal>
);

class ChooseDevice extends Component<
  {
    navigation: NavigationScreenProp<*>,
    isFocused: boolean,
    readOnlyModeEnabled: boolean,
    knownDevices: DeviceLike[],
    removeKnownDevice: string => void,
  },
  {
    showMenu: boolean,
  },
> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    let key = "manager.title";

    if (params) {
      if (params.title) {
        key = params.title;
      }
    }
    const title = i18next.t(key);
    return {
      title,
      headerRight: null,
    };
  };

  state = {
    showMenu: false,
  };

  chosenDevice: DeviceMeta;

  onShowMenu = (device: DeviceMeta) => {
    this.chosenDevice = device;
    this.setState({ showMenu: true });
  };

  onHideMenu = () => {
    this.setState({ showMenu: false });
  };

  onSelect = (meta: Object) => {
    const { fullVersion, seVersion, mcuVersion } = meta.deviceInfo;
    track("ManagerDeviceEntered", {
      fullVersion,
      seVersion,
      mcuVersion,
    });
    this.props.navigation.navigate("ManagerMain", {
      meta,
    });
  };

  onStepEntered = (i: number, meta: Object) => {
    if (i === 2) {
      Promise.all([
        // Step dashboard, we preload the applist before entering manager while we're still doing the genuine check
        manager
          .getAppsList(meta.deviceInfo)
          .then(apps =>
            Promise.all(
              apps.map(app => Image.prefetch(manager.getIconUrl(app.icon))),
            ),
          ),
        // we also preload as much info as possible in case of a MCU
        manager.getLatestFirmwareForDevice(meta.deviceInfo),
      ]).catch(e => {
        console.warn(e);
      });
    }
  };

  unpair = async () => {
    const { removeKnownDevice } = this.props;
    removeKnownDevice(this.chosenDevice.deviceId);
    this.onHideMenu();
  };

  componentDidMount() {
    const { readOnlyModeEnabled } = this.props;

    if (readOnlyModeEnabled) {
      this.props.navigation.setParams({
        title: "manager.readOnly.title",
        headerRight: null,
      });
    }
  }

  render() {
    const { isFocused } = this.props;
    const { showMenu } = this.state;

    if (!isFocused) return null;

    return (
      <ScrollView style={styles.root}>
        <TrackScreen category="Manager" name="ChooseDevice" />
        <LText semiBold style={styles.title}>
          <Trans i18nKey="manager.connect" />
        </LText>

        <SelectDevice
          onSelect={this.onSelect}
          steps={[connectingStep, dashboard, genuineCheck, getDeviceName]}
          onStepEntered={this.onStepEntered}
          onBluetoothDeviceAction={this.onShowMenu}
        />

        {this.chosenDevice && (
          <UnpairDeviceModal
            onHideMenu={this.onHideMenu}
            open={showMenu}
            unPair={this.unpair}
            deviceName={this.chosenDevice.deviceName}
          />
        )}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
  },
  or: {
    marginVertical: 30,
  },
  title: {
    lineHeight: 27,
    fontSize: 18,
    marginVertical: 24,
    color: colors.darkBlue,
  },
  section: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
    color: colors.grey,
  },
  addContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  add: {
    marginRight: 8,
    color: colors.live,
  },
  bluetoothHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  footerContainer: {
    flexDirection: "row",
  },
  buttonContainer: {
    flex: 1,
  },
  buttonMarginLeft: {
    marginLeft: 16,
  },
});

export default compose(
  translate(),
  connect(
    null,
    { removeKnownDevice },
  ),
)(withNavigationFocus(ChooseDevice));
