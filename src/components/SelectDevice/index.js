// @flow
import React, { Component } from "react";
import { StyleSheet, View } from "react-native";
import Config from "react-native-config";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { discoverDevices } from "@ledgerhq/live-common/lib/hw";
import { Trans } from "react-i18next";
import type { TransportModule } from "@ledgerhq/live-common/lib/hw";
import Icon from "react-native-vector-icons/dist/Feather";
import { withNavigation } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { knownDevicesSelector } from "../../reducers/ble";
import { removeKnownDevice } from "../../actions/ble";
import DeviceItem from "../DeviceItem";
import DeviceJob from "../DeviceJob";
import type { Step, DeviceMeta } from "../DeviceJob/types";
import { setReadOnlyMode } from "../../actions/settings";
import BluetoothEmpty from "./BluetoothEmpty";
import USBEmpty from "./USBEmpty";
import LText from "../LText";
import Touchable from "../Touchable";
import colors from "../../colors";
import Circle from "../Circle";

type Props = {
  onBluetoothDeviceAction?: (device: DeviceMeta) => any,
  onSelect: (meta: DeviceMeta) => void,
  steps?: Step[],
  onStepEntered?: (number, Object) => void,
  onboarding?: boolean,
  filter?: TransportModule => boolean,
  navigation: NavigationScreenProp<*>,
};

type OwnProps = Props & {
  knownDevices: Array<{
    id: string,
    name: string,
  }>,
  removeKnownDevice: string => *,
  onBluetoothDeviceAction: DeviceMeta => any,
  setReadOnlyMode: boolean => void,
};

type State = {
  devices: Array<{
    id: string,
    name: string,
    modelId: ?string,
  }>,
  scanning: boolean,
  connecting: ?DeviceMeta,
  showMenu: boolean,
};

const IconPlus = () => (
  <Circle bg={colors.live} size={14}>
    <Icon name="plus" size={10} color={colors.white} />
  </Circle>
);

const BluetoothHeader = ({ onPairNewDevice }: { onPairNewDevice: () => * }) => (
  <Touchable
    event="PairNewDevice"
    style={styles.bluetoothHeader}
    onPress={onPairNewDevice}
  >
    <LText semiBold style={styles.section}>
      <Trans i18nKey="common.bluetooth" />
    </LText>
    <View style={styles.addContainer}>
      <LText semiBold style={styles.add}>
        <Trans i18nKey="common.add" />
      </LText>
      <IconPlus />
    </View>
  </Touchable>
);

const USBHeader = () => (
  <LText semiBold style={styles.section}>
    <Trans i18nKey="common.usb" />
  </LText>
);

class SelectDevice extends Component<OwnProps, State> {
  static defaultProps = {
    steps: [],
    filter: () => true,
    showDiscoveredDevices: true,
    showKnownDevices: true,
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
                  id: e.id,
                  name: e.name,
                  modelId: e.deviceModel && e.deviceModel.id,
                })
              : devices.filter(d => d.id !== e.id),
        })),
    });
  }

  onSelect = ({ id, modelId, name }) => {
    let connecting = null;
    if (id.startsWith("httpdebug|")) {
      /*
     * This allow to define these env to override the behavior
     * FALLBACK_DEVICE_MODEL_ID=nanoS
     * FALLBACK_DEVICE_WIRED=YES
     */
      connecting = {
        deviceId: id,
        modelId: modelId || (Config.FALLBACK_DEVICE_MODEL_ID || "nanoX"),
        deviceName: name || "",
        wired: Config.FALLBACK_DEVICE_WIRED === "YES",
      };
    } else {
      connecting = {
        deviceId: id,
        modelId: modelId || "nanoX",
        deviceName: name || "",
        wired: id.startsWith("usb|"),
      };
    }
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
    const { navigation } = this.props;
    navigation.navigate("PairDevices");
  };

  renderItem = (item: *) => (
    <DeviceItem
      key={item.id}
      device={item}
      onSelect={this.onSelect}
      withArrow={!!this.props.onboarding}
      onBluetoothDeviceAction={this.props.onBluetoothDeviceAction}
      {...item}
    />
  );

  keyExtractor = (item: *) => item.id;

  render() {
    const { knownDevices, steps, onStepEntered } = this.props;
    const { devices, connecting } = this.state;

    const [ble, other] = devices
      .concat(knownDevices)
      .reduce(
        ([ble, other], device) =>
          device.id.includes("|")
            ? [ble, [...other, device]]
            : [[...ble, device], other],
        [[], []],
      );

    return (
      <View>
        {ble.length === 0 ? (
          <BluetoothEmpty />
        ) : (
          <View>
            <BluetoothHeader onPairNewDevice={this.onPairNewDevice} />
            {ble.map(this.renderItem)}
            <USBHeader />
          </View>
        )}
        {other.length === 0 ? <USBEmpty /> : other.map(this.renderItem)}

        <DeviceJob
          meta={connecting}
          steps={steps}
          onCancel={this.onCancel}
          onStepEntered={onStepEntered}
          onDone={this.onDone}
          editMode={false}
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
});
