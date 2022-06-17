import React, { Component } from "react";
import { StyleSheet } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { Trans } from "react-i18next";
import manager from "@ledgerhq/live-common/lib/manager";
import { disconnect } from "@ledgerhq/live-common/lib/hw";
import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";

import connectManager from "@ledgerhq/live-common/lib/hw/connectManager";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/manager";
import { Text } from "@ledgerhq/native-ui";
import { removeKnownDevice } from "../../actions/ble";
import { ScreenName } from "../../const";
import { ManagerTab } from "./Manager";
import SelectDevice from "../../components/SelectDevice";
import TrackScreen from "../../analytics/TrackScreen";
// @FlowFixMe
import { track } from "../../analytics";
import Button from "../../components/Button";
// @FlowFixMe
import type { DeviceLike } from "../../reducers/ble";
import Trash from "../../icons/Trash";
import BottomModal from "../../components/BottomModal";
import ModalBottomAction from "../../components/ModalBottomAction";
import NavigationScrollView from "../../components/NavigationScrollView";
import DeviceActionModal from "../../components/DeviceActionModal";
import Illustration from "../../images/illustration/Illustration";

const darkImg = require("../../images/illustration/Dark/_079.png");
const lightImg = require("../../images/illustration/Light/_079.png");

const action = createAction(connectManager);

const RemoveDeviceModal = ({
  onHideMenu,
  remove,
  open,
  deviceName,
}: {
  onHideMenu: () => void;
  remove: () => Promise<void>;
  open: boolean;
  deviceName: string;
}) => (
  <BottomModal id="DeviceItemModal" isOpened={open} onClose={onHideMenu}>
    <ModalBottomAction
      icon={
        <Illustration size={100} darkSource={darkImg} lightSource={lightImg} />
      }
      title={deviceName}
      uppercase={false}
      footer={
        <Button
          event="HardResetModalAction"
          type="alert"
          IconLeft={Trash}
          title={<Trans i18nKey="common.forgetDevice" />}
          onPress={remove}
        />
      }
    />
  </BottomModal>
);

type RouteParams = {
  searchQuery?: string;
  tab?: ManagerTab;
  installApp?: string;
  firmwareUpdate?: boolean;
  device?: Device;
  appsToRestore?: string[];
};

type Props = {
  navigation: any;
  knownDevices: DeviceLike[];
  route: {
    params: RouteParams;
    name: string;
  };
};

type ChooseDeviceProps = Props & {
  isFocused: boolean;
  removeKnownDevice: (d: string) => void;
};

class ChooseDevice extends Component<
  ChooseDeviceProps,
  {
    showMenu: boolean;
    device?: Device;
    result?: Object;
  }
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
    const {
      route: { params = {} },
    } = this.props;
    result?.result &&
      this.props.navigation.navigate(ScreenName.ManagerMain, {
        ...result,
        ...params,
        searchQuery: params.searchQuery || params.installApp,
      });
  };

  onModalHide = () => {
    this.setState({ device: undefined });
  };

  onStepEntered = (i: number, meta: Object) => {
    if (i === 2) {
      // we also preload as much info as possible in case of a MCU
      manager.getLatestFirmwareForDevice(meta.deviceInfo).then(
        () => {},
        () => {},
      );
    }
  };

  remove = async () => {
    const { removeKnownDevice } = this.props;
    removeKnownDevice(this.chosenDevice.deviceId);
    await disconnect(this.chosenDevice.deviceId).catch(() => {});
    this.onHideMenu();
  };

  componentDidMount() {
    this.setState(state => ({ ...state, device: this.props.route.params?.device }));
  }

  render() {
    const {
      isFocused,
      route: { params = {} },
    } = this.props;
    const { showMenu, device } = this.state;

    if (!isFocused) return null;

    return (
      <NavigationScrollView
        style={[styles.root]}
        contentContainerStyle={styles.scrollContainer}
      >
        <TrackScreen category="Manager" name="ChooseDevice" />
        <Text fontWeight="semiBold" variant="h3">
          <Trans i18nKey="manager.connect" />
        </Text>
        <SelectDevice
          usbOnly={params?.firmwareUpdate}
          autoSelectOnAdd
          onSelect={this.onSelectDevice}
          onStepEntered={this.onStepEntered}
          onBluetoothDeviceAction={this.onShowMenu}
        />
        <DeviceActionModal
          onClose={() => this.onSelectDevice()}
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

  return (
    <ChooseDevice
      {...props}
      isFocused={isFocused}
      removeKnownDevice={(...args) => dispatch(removeKnownDevice(...args))}
    />
  );
}
