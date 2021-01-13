/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { Trans } from "react-i18next";
import manager from "@ledgerhq/live-common/lib/manager";
import { disconnect } from "@ledgerhq/live-common/lib/hw";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";

import connectManager from "@ledgerhq/live-common/lib/hw/connectManager";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/manager";
import { removeKnownDevice } from "../../actions/ble";
import { ScreenName } from "../../const";
import type { ManagerTab } from "./Manager";
import SelectDevice from "../../components/SelectDevice";
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
import DeviceActionModal from "../../components/DeviceActionModal";

const action = createAction(connectManager);

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

type RouteParams = {
  searchQuery?: string,
  tab?: ManagerTab,
};

type Props = {
  navigation: any,
  knownDevices: DeviceLike[],
  route: {
    params: RouteParams,
    name: string,
  },
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
    device?: Device,
    result?: Object,
  },
> {
  state = {
    showMenu: false,
    device: undefined,
    result: undefined,
  };

  chosenDevice: Device;

  onShowMenu = (device: Device) => {
    this.chosenDevice = device;
    this.setState({ showMenu: true });
  };

  onHideMenu = () => {
    this.setState({ showMenu: false });
  };

  onSelectDevice = (device?: Device) => {
    if (device)
      track("ManagerDeviceEntered", {
        modelId: device.modelId,
      });
    this.setState({ device });
  };

  onSelect = (result: Object) => {
    this.setState({ device: undefined, result });
  };

  onModalHide = () => {
    const { result } = this.state;
    result?.result &&
      this.props.navigation.navigate(ScreenName.ManagerMain, {
        ...result,
        ...this.props.route.params,
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
    this.setState(state => ({ ...state, device: undefined }));

    if (readOnlyModeEnabled) {
      this.props.navigation.setParams({
        title: "manager.readOnly.title",
        headerRight: null,
      });
    }
  }

  render() {
    const { isFocused, readOnlyModeEnabled } = this.props;
    const { showMenu, device } = this.state;

    if (!isFocused) return null;

    if (readOnlyModeEnabled) {
      return <ReadOnlyNanoX navigation={this.props.navigation} />;
    }

    return (
      <NavigationScrollView
        style={[styles.root]}
        contentContainerStyle={styles.scrollContainer}
      >
        <TrackScreen category="Manager" name="ChooseDevice" />
        <LText semiBold style={styles.title}>
          <Trans i18nKey="manager.connect" />
        </LText>
        <SelectDevice
          autoSelectOnAdd
          onSelect={this.onSelectDevice}
          onStepEntered={this.onStepEntered}
          onBluetoothDeviceAction={this.onShowMenu}
        />
        <DeviceActionModal
          onClose={this.onSelectDevice}
          device={device}
          onResult={this.onSelect}
          onModalHide={this.onModalHide}
          action={action}
          request={null}
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
  },
  scrollContainer: {
    paddingHorizontal: 16,
  },
  title: {
    lineHeight: 27,
    fontSize: 18,
    marginVertical: 24,
  },
  footerContainer: {
    flexDirection: "row",
  },
  buttonContainer: {
    flex: 1,
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
