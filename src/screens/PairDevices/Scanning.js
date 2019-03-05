// @flow

import React, { Component, Fragment } from "react";
import { StyleSheet } from "react-native";
// $FlowFixMe
import { FlatList } from "react-navigation";
import { connect } from "react-redux";
import { Trans } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { Observable } from "rxjs";
import logger from "../../logger";
import { BLE_SCANNING_NOTHING_TIMEOUT } from "../../constants";
import { knownDevicesSelector } from "../../reducers/ble";
import type { DeviceLike } from "../../reducers/ble";
import TransportBLE from "../../react-native-hw-transport-ble";
import { TrackScreen } from "../../analytics";
import DeviceItem from "../../components/DeviceItem";
import ScanningHeader from "./ScanningHeader";

type Props = {
  knownDevices: DeviceLike[],
  onSelect: Device => *,
  onError: Error => *,
  onTimeout: () => *,
};

type Device = {
  id: string,
  name: string,
};

type State = {
  devices: Device[],
};

class Scanning extends Component<Props, State> {
  state = {
    devices: [],
  };

  sub: *;

  timeout: *;

  componentDidMount() {
    this.timeout = setTimeout(() => {
      this.props.onTimeout();
    }, BLE_SCANNING_NOTHING_TIMEOUT);
    this.startScan();
  }

  componentWillUnmount() {
    if (this.sub) this.sub.unsubscribe();
    clearTimeout(this.timeout);
  }

  startScan = async () => {
    this.sub = Observable.create(TransportBLE.listen).subscribe({
      next: e => {
        if (e.type === "add") {
          clearTimeout(this.timeout);
          const device = e.descriptor;
          this.setState(({ devices }) => ({
            // FIXME seems like we have dup. ideally we'll remove them on the listen side!
            devices: devices.some(i => i.id === device.id)
              ? devices
              : devices.concat(device),
          }));
        }
      },
      error: error => {
        logger.critical(error);
        this.props.onError(error);
      },
    });
  };

  keyExtractor = (item: *) => item.id;

  reload = async () => {
    if (this.sub) this.sub.unsubscribe();
    this.startScan();
  };

  renderItem = ({ item }: { item: * }) => {
    const knownDevice = this.props.knownDevices.find(d => d.id === item.id);
    return (
      <DeviceItem
        device={item}
        deviceMeta={{
          deviceId: item.id,
          deviceName: item.name,
          wired: false,
          modelId: "nanoX",
        }}
        onSelect={() => this.props.onSelect(item)}
        disabled={!!knownDevice}
        description={
          knownDevice ? <Trans i18nKey="PairDevices.alreadyPaired" /> : ""
        }
      />
    );
  };

  ListHeader = () => <ScanningHeader />;

  render() {
    const { devices } = this.state;
    return (
      <Fragment>
        <TrackScreen category="PairDevices" name="Scanning" />
        <FlatList
          style={styles.list}
          data={devices}
          renderItem={this.renderItem}
          keyExtractor={this.keyExtractor}
          ListHeaderComponent={this.ListHeader}
        />
      </Fragment>
    );
  }
}

export default connect(
  createStructuredSelector({
    knownDevices: knownDevicesSelector,
  }),
)(Scanning);

const styles = StyleSheet.create({
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
