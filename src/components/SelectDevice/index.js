// @flow
import React, { Component, Fragment } from "react";
import Config from "react-native-config";
import { StyleSheet } from "react-native";
import { FlatList } from "react-navigation";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { discoverDevices } from "@ledgerhq/live-common/lib/hw";
import type { TransportModule } from "@ledgerhq/live-common/lib/hw";
import { knownDevicesSelector } from "../../reducers/ble";
import { removeKnownDevice } from "../../actions/ble";
import DeviceItem from "../DeviceItem";
import DeviceJob from "../DeviceJob";
import type { Step, DeviceMeta } from "../DeviceJob/types";
import Header from "./Header";
import Footer from "./Footer";
import { setReadOnlyMode } from "../../actions/settings";

type Props = {
  onForgetSelect?: (deviceId: string) => any,
  // info is an object with { deviceId, modelId } and potentially other stuff
  onSelect: (meta: DeviceMeta) => void,
  steps?: Step[],
  selectedIds?: string[],
  editMode?: boolean,
  onStepEntered?: (number, Object) => void,
  onboarding?: boolean,
  filter?: TransportModule => boolean,
};

type OwnProps = Props & {
  knownDevices: Array<{
    id: string,
    name: string,
  }>,
  removeKnownDevice: string => *,
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
};

class SelectDevice extends Component<OwnProps, State> {
  static defaultProps = {
    steps: [],
    filter: () => true,
  };

  state = {
    devices: [],
    scanning: true,
    connecting: null,
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
    this.listingSubscription.unsubscribe();
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

  renderItem = ({ item }: *) => (
    <DeviceItem
      key={item.id}
      device={item}
      onSelect={this.onSelect}
      withArrow={!!this.props.onboarding}
      onForgetSelect={
        this.props.editMode ? this.props.onForgetSelect : undefined
      }
      selected={
        this.props.selectedIds
          ? this.props.selectedIds.includes(item.id)
          : undefined
      }
      {...item}
    />
  );

  keyExtractor = (item: *) => item.id;

  render() {
    const { knownDevices, steps, editMode, onStepEntered } = this.props;
    const { devices, connecting } = this.state;
    const data = devices.concat(knownDevices);

    return (
      <Fragment>
        <FlatList
          contentContainerStyle={styles.root}
          data={data}
          renderItem={this.renderItem}
          ListHeaderComponent={Header}
          ListFooterComponent={editMode ? null : Footer}
          keyExtractor={this.keyExtractor}
        />
        <DeviceJob
          meta={connecting}
          steps={steps}
          onCancel={this.onCancel}
          onStepEntered={onStepEntered}
          onDone={this.onDone}
          editMode={editMode}
        />
      </Fragment>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
  },
});

const Result: React$ComponentType<Props> = connect(
  createStructuredSelector({
    knownDevices: knownDevicesSelector,
  }),
  {
    removeKnownDevice,
    setReadOnlyMode,
  },
)(SelectDevice);

export default Result;
