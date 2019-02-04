// @flow
import React, { Component, Fragment } from "react";
import { StyleSheet } from "react-native";
// $FlowFixMe
import { FlatList } from "react-navigation";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { discoverDevices } from "@ledgerhq/live-common/lib/hw";
import { knownDevicesSelector } from "../../reducers/ble";
import { experimentalUSBEnabledSelector } from "../../reducers/settings";
import { removeKnownDevice } from "../../actions/ble";
import DeviceItem from "../DeviceItem";
import DeviceJob from "../DeviceJob";
import type { Step } from "../DeviceJob/types";
import Header from "./Header";
import Footer from "./Footer";
import { setReadOnlyMode } from "../../actions/settings";

type Props = {
  onForgetSelect?: (deviceId: string) => any,
  onSelect: (deviceId: string, meta: Object) => void,
  selectedIds?: string[],
  steps: Step[],
  editMode?: boolean,
  // connect-ed
  experimentalUSBEnabled: boolean,
  knownDevices: Array<{
    id: string,
    name: string,
  }>,
  removeKnownDevice: string => *,
  onStepEntered?: (number, Object) => void,
  setReadOnlyMode: boolean => void,
  onboarding?: boolean,
};

type State = {
  devices: Array<{
    id: string,
    name: string,
    family: string,
  }>,
  scanning: boolean,
  connecting: boolean,
  connectingId: ?string,
};

class SelectDevice extends Component<Props, State> {
  static defaultProps = {
    steps: [],
  };

  state = {
    devices: [],
    scanning: true,
    connecting: false,
    connectingId: null,
  };

  listingSubscription: *;

  componentDidMount() {
    this.observe();
  }

  componentDidUpdate({ experimentalUSBEnabled, knownDevices }) {
    if (
      this.props.experimentalUSBEnabled !== experimentalUSBEnabled ||
      this.props.knownDevices !== knownDevices
    ) {
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
    this.listingSubscription = discoverDevices(m => {
      switch (m.id) {
        case "hid":
          return this.props.experimentalUSBEnabled;
        default:
          return true;
      }
    }).subscribe({
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
                  family: e.family,
                })
              : devices.filter(d => d.id !== e.id),
        })),
    });
  }

  onSelect = ({ id }) => {
    this.setState({ connecting: true, connectingId: id });
  };

  onDone = (id, meta) => {
    this.setState({ connecting: false }, () => {
      this.props.onSelect(id, meta);
    });

    // Always false until we pair a device?
    this.props.setReadOnlyMode(false);
  };

  onCancel = () => {
    this.setState({ connecting: false });
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
    const { devices, connecting, connectingId } = this.state;

    const data = devices.concat(knownDevices);
    const connectingDevice = data.find(d => d.id === connectingId);

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
          deviceName={connectingDevice ? connectingDevice.name : ""}
          deviceId={connecting && connectingId ? connectingId : null}
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

export default connect(
  createStructuredSelector({
    knownDevices: knownDevicesSelector,
    experimentalUSBEnabled: experimentalUSBEnabledSelector,
  }),
  {
    removeKnownDevice,
    setReadOnlyMode,
  },
)(SelectDevice);
