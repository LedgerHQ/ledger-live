/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { Trans } from "react-i18next";
import manager from "@ledgerhq/live-common/lib/manager";
import { disconnect } from "@ledgerhq/live-common/lib/hw";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { removeKnownDevice } from "../../actions/ble";
import { ScreenName } from "../../const";
import {
  connectingStep,
  dashboard,
  listApps,
  getDeviceName,
} from "../../components/DeviceJob/steps";
import SelectDevice from "../../components/SelectDevice";
import colors from "../../colors";
import TrackScreen from "../../analytics/TrackScreen";
import { track } from "../../analytics";
import LText from "../../components/LText";
import Button from "../../components/Button";
import type { DeviceLike } from "../../reducers/ble";
import Trash from "../../icons/Trash";
import BottomModal from "../../components/BottomModal";
import ModalBottomAction from "../../components/ModalBottomAction";
import NavigationScrollView from "../../components/NavigationScrollView";
import ReadOnlyNanoX from "./Connect/ReadOnlyNanoX";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";

const RemoveDeviceModal = ({
  onHideMenu,
  remove,
  open,
  deviceName,
}: {
  onHideMenu: () => void,
  remove: () => Promise<void>,
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
            onPress={remove}
            containerStyle={styles.buttonContainer}
          />
        </View>
      }
    />
  </BottomModal>
);

type Props = {
  navigation: any,
  knownDevices: DeviceLike[],
};

type ChooseDeviceProps = Props & {
  isFocused: boolean,
  readOnlyModeEnabled: boolean,
  removeKnownDevice: string => void,
};

class ChooseDevice extends Component<
  ChooseDeviceProps,
  {
    showMenu: boolean,
  },
> {
  state = {
    showMenu: false,
  };

  chosenDevice: Device;

  onShowMenu = (device: Device) => {
    this.chosenDevice = device;
    this.setState({ showMenu: true });
  };

  onHideMenu = () => {
    this.setState({ showMenu: false });
  };

  onSelect = (meta: Object) => {
    const { version, mcuVersion } = meta.deviceInfo;
    track("ManagerDeviceEntered", {
      version,
      mcuVersion,
    });
    this.props.navigation.navigate(ScreenName.ManagerMain, {
      meta,
    });
  };

  onStepEntered = (i: number, meta: Object) => {
    if (i === 2) {
      // we also preload as much info as possible in case of a MCU
      manager.getLatestFirmwareForDevice(meta.deviceInfo);
    }
  };

  remove = async () => {
    const { removeKnownDevice } = this.props;
    removeKnownDevice(this.chosenDevice.deviceId);
    await disconnect(this.chosenDevice.deviceId).catch(() => {});
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
    const { isFocused, readOnlyModeEnabled } = this.props;
    const { showMenu } = this.state;

    if (!isFocused) return null;

    if (readOnlyModeEnabled) {
      return <ReadOnlyNanoX navigation={this.props.navigation} />;
    }

    return (
      <NavigationScrollView style={styles.root}>
        <TrackScreen category="Manager" name="ChooseDevice" />
        <LText semiBold style={styles.title}>
          <Trans i18nKey="manager.connect" />
        </LText>

        <SelectDevice
          onSelect={this.onSelect}
          steps={[connectingStep, dashboard, listApps, getDeviceName]}
          onStepEntered={this.onStepEntered}
          onBluetoothDeviceAction={this.onShowMenu}
        />

        {this.chosenDevice && (
          <RemoveDeviceModal
            onHideMenu={this.onHideMenu}
            open={showMenu}
            remove={this.remove}
            deviceName={this.chosenDevice.deviceName || ""}
          />
        )}
      </NavigationScrollView>
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

export default function Screen(props: Props) {
  const isFocused = useIsFocused();
  const dispatch = useDispatch();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  return (
    <ChooseDevice
      {...props}
      isFocused={isFocused}
      readOnlyModeEnabled={readOnlyModeEnabled}
      removeKnownDevice={(...args) => dispatch(removeKnownDevice(...args))}
    />
  );
}
