// @flow

import React, { Component } from "react";
import { FlatList } from "react-native";
import { devicesObservable } from "../../logic/hw";
import SelectDeviceItem from "./Item";
import ScanningFooter from "./ScanningFooter";

class SelectDevice extends Component<
  {
    onSelectItem: string => void,
  },
  {
    devices: Array<{
      id: string,
      name: string,
      type: string,
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
      next: device =>
        this.setState(({ devices }) => ({ devices: devices.concat(device) })),
    });
  }

  renderItem = ({ item }: *) => (
    <SelectDeviceItem
      key={item.id}
      onSelectItem={this.props.onSelectItem}
      {...item}
    />
  );

  keyExtractor = (item: *) => item.id;

  render() {
    const { devices, pending } = this.state;
    return (
      <FlatList
        data={devices}
        renderItem={this.renderItem}
        ListFooterComponent={pending ? ScanningFooter : null}
        keyExtractor={this.keyExtractor}
      />
    );
  }
}

export default SelectDevice;
