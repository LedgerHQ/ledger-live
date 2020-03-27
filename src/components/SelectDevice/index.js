// @flow
import React, { Component } from "react";
import { StyleSheet, View, Platform, Image } from "react-native";
import Config from "react-native-config";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { discoverDevices } from "@ledgerhq/live-common/lib/hw";
import { Trans } from "react-i18next";
import type { TransportModule } from "@ledgerhq/live-common/lib/hw";
import { withNavigation } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { knownDevicesSelector } from "../../reducers/ble";
import { removeKnownDevice } from "../../actions/ble";
import DeviceItem from "../DeviceItem";
import DeviceJob from "../DeviceJob";
import type { Step } from "../DeviceJob/types";
import { setReadOnlyMode } from "../../actions/settings";
import BluetoothEmpty from "./BluetoothEmpty";
import USBEmpty from "./USBEmpty";
import LText from "../LText";
import colors from "../../colors";
import SectionSeparator from "../SectionSeparator";
import type { DeviceNames } from "../../screens/Onboarding/types";
import PairNewDeviceButton from "./PairNewDeviceButton";

type Props = {
  onBluetoothDeviceAction?: (device: Device) => any,
  onSelect: (meta: Device) => void,
  deviceMeta?: Device,
  steps?: Step[],
  onStepEntered?: (number, Object) => void,
  withArrows?: boolean,
  usbOnly?: boolean,
  filter?: TransportModule => boolean,
  deviceModelId: DeviceNames,
  navigation: NavigationScreenProp<*>,
  autoSelectOnAdd?: boolean,
};

type OwnProps = Props & {
  knownDevices: Array<{
    id: string,
    name: string,
  }>,
  removeKnownDevice: string => *,
  onBluetoothDeviceAction: Device => any,
  setReadOnlyMode: boolean => void,
};

type State = {
  devices: Array<Device>,
  scanning: boolean,
  connecting: ?Device,
  showMenu: boolean,
};

const BluetoothHeader = () => (
  <View style={styles.bluetoothHeader}>
    <LText semiBold style={styles.section}>
      <Trans i18nKey="common.bluetooth" />
    </LText>
  </View>
);

const USBHeader = () => (
  <LText semiBold style={styles.section}>
    <Trans i18nKey="common.usb" />
  </LText>
);

// Fixme Use the illustration instead of the png
const UsbPlaceholder = () => (
  <View style={styles.usbContainer}>
    <Image source={require("../../images/connect-nanos-mobile.png")} />
  </View>
);

const ORBar = () => (
  <SectionSeparator
    thin
    style={styles.or}
    text={<Trans i18nKey="common.or" />}
  />
);

const getAll = ({ knownDevices }, { devices }): Device[] =>
  devices.concat(
    knownDevices.map(d => ({
      deviceId: d.id,
      deviceName: d.name || "",
      wired: false,
      modelId: "nanoX",
    })),
  );

class SelectDevice extends Component<OwnProps, State> {
  static defaultProps = {
    steps: [],
    filter: () => true,
    showDiscoveredDevices: true,
    showKnownDevices: true,
    autoSelectOnAdd: false,
  };

  state = {
    devices: [],
    scanning: true,
    connecting: null,
    showMenu: false,
  };

  listingSubscription: *;

  componentDidMount() {
    this.observe();
  }

  componentDidUpdate({ knownDevices }) {
    if (this.props.knownDevices !== knownDevices) {
      this.observe();
    }
  }

  componentWillUnmount() {
    if (this.listingSubscription) {
      this.listingSubscription.unsubscribe();
    }
  }

  observe() {
    if (this.listingSubscription) {
      this.listingSubscription.unsubscribe();
      this.setState({ devices: [] });
    }
    this.listingSubscription = discoverDevices(this.props.filter).subscribe({
      complete: () => {
        this.setState({ scanning: false });
      },
      next: e =>
        this.setState(({ devices }) => ({
          devices:
            e.type === "add"
              ? devices.concat({
                  deviceId: e.id,
                  deviceName: e.name || "",
                  modelId:
                    (e.deviceModel && e.deviceModel.id) ||
                    (Config.FALLBACK_DEVICE_MODEL_ID || "nanoX"),
                  wired: e.id.startsWith("httpdebug|")
                    ? Config.FALLBACK_DEVICE_WIRED === "YES"
                    : e.id.startsWith("usb|"),
                })
              : devices.filter(d => d.deviceId !== e.id),
        })),
    });
  }

  onSelect = (connecting: Device) => {
    this.setState({ connecting });
  };

  onDone = info => {
    this.setState({ connecting: null }, () => {
      this.props.onSelect(info);
    });

    // Always false until we pair a device?
    this.props.setReadOnlyMode(false);
  };

  onCancel = () => {
    this.setState({ connecting: null });
  };

  onPairNewDevice = () => {
    const { navigation, autoSelectOnAdd } = this.props;
    let opts;
    if (autoSelectOnAdd) {
      opts = {
        onDone: deviceId => {
          const device = getAll(this.props, this.state).find(
            d => d.deviceId === deviceId,
          );
          if (device) {
            this.onSelect(device);
          }
        },
      };
    }
    navigation.navigate("PairDevices", opts);
  };

  renderItem = (item: Device) => (
    <DeviceItem
      key={item.deviceId}
      deviceMeta={item}
      onSelect={this.onSelect}
      withArrow={!!this.props.withArrows}
      onBluetoothDeviceAction={this.props.onBluetoothDeviceAction}
    />
  );

  keyExtractor = (item: *) => item.id;

  render() {
    const {
      steps,
      onStepEntered,
      usbOnly,
      withArrows,
      deviceModelId,
      deviceMeta,
    } = this.props;
    const { connecting } = this.state;

    const all: Device[] = getAll(this.props, this.state);

    const [ble, other] = all.reduce(
      ([ble, other], device) =>
        device.wired ? [ble, [...other, device]] : [[...ble, device], other],
      [[], []],
    );

    const hasUSBSection = Platform.OS === "android" || other.length > 0;

    return (
      <View>
        {usbOnly && withArrows ? (
          <UsbPlaceholder />
        ) : ble.length === 0 ? (
          <BluetoothEmpty onPairNewDevice={this.onPairNewDevice} />
        ) : (
          <View>
            <BluetoothHeader />
            {ble.map(this.renderItem)}
            <PairNewDeviceButton onPress={this.onPairNewDevice} />
          </View>
        )}
        {hasUSBSection &&
          !usbOnly &&
          (ble.length === 0 ? <ORBar /> : <USBHeader />)}
        {other.length === 0 ? <USBEmpty /> : other.map(this.renderItem)}

        <DeviceJob
          meta={deviceMeta || connecting}
          steps={steps}
          onCancel={this.onCancel}
          onStepEntered={onStepEntered}
          onDone={this.onDone}
          editMode={false}
          deviceModelId={deviceModelId}
        />
      </View>
    );
  }
}

export default connect(
  createStructuredSelector({
    knownDevices: knownDevicesSelector,
  }),
  {
    removeKnownDevice,
    setReadOnlyMode,
  },
)(withNavigation(SelectDevice));

const styles = StyleSheet.create({
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
  or: {
    marginVertical: 30,
  },
  usbContainer: {
    alignItems: "center",
    marginVertical: 30,
  },
});
