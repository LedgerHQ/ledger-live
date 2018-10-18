// @flow

import React, { Component } from "react";
import { FlatList, Alert, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { open, devicesObservable } from "../../logic/hw";
import { knownDevicesSelector } from "../../reducers/ble";
import { removeKnownDevice } from "../../actions/ble";
import DeviceItem from "../DeviceItem";
import ScanningFooter from "./ScanningFooter";

class SelectDevice extends Component<
  {
    onSelect: string => void,
    knownDevices: Array<{
      id: string,
      name: string,
    }>,
    removeKnownDevice: string => *,
    editMode?: boolean,
  },
  {
    devices: Array<{
      id: string,
      name: string,
      family: string,
    }>,
    pending: boolean,
  },
> {
  state = {
    devices: [],
    pending: true,
  };

  componentDidMount() {
    devicesObservable.subscribe({
      complete: () => {
        this.setState({ pending: false });
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
              : devices.filter(d => d.id === e.id),
        })),
    });
  }

  onForget = async ({ id }) => {
    this.props.removeKnownDevice(id);
  };

  onSelect = async ({ id, family }) => {
    if (!family) {
      // this is ble case
      try {
        const t = await open(id);
        await t.close();
      } catch (e) {
        Alert.alert(
          "Failed to connect to device with Bluetooth",
          "Would you like to forget the device to attempt to pair it again?",
          [
            {
              text: "Ask me later",
              onPress: () => {},
              style: "cancel",
            },
            {
              text: "OK",
              onPress: () => {
                this.props.removeKnownDevice(id);
              },
            },
          ],
          { cancelable: false },
        );
        return;
      }
    }
    this.props.onSelect(id);
  };

  renderItem = ({ item }: *) => (
    <DeviceItem
      key={item.id}
      device={item}
      onSelect={this.onSelect}
      onForget={this.props.editMode ? this.onForget : undefined}
      {...item}
    />
  );

  keyExtractor = (item: *) => item.id;

  render() {
    const { devices, pending } = this.state;
    const { knownDevices } = this.props;

    // $FlowFixMe
    const data = devices.concat(knownDevices);

    return (
      <FlatList
        contentContainerStyle={styles.root}
        data={data}
        renderItem={this.renderItem}
        ListFooterComponent={pending ? ScanningFooter : null}
        keyExtractor={this.keyExtractor}
      />
    );
  }
}

const styles = StyleSheet.create({
  root: {
    padding: 20,
  },
});

export default connect(
  createStructuredSelector({
    knownDevices: knownDevicesSelector,
  }),
  {
    removeKnownDevice,
  },
)(SelectDevice);
