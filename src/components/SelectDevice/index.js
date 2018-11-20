// @flow
import React, { Component, Fragment } from "react";
import { FlatList, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { devicesObservable } from "../../logic/hw";
import { knownDevicesSelector } from "../../reducers/ble";
import { removeKnownDevice } from "../../actions/ble";
import DeviceItem from "../DeviceItem";
import DeviceJob from "../DeviceJob";
import type { Step } from "../DeviceJob/types";
import Header from "./Header";
import Footer from "./Footer";
import RemoveDeviceButton from "./RemoveDeviceButton";

type Props = {
  onSelect: (deviceId: string, meta: Object) => void,
  steps: Step[],
  editMode?: boolean,
  // connect-ed
  knownDevices: Array<{
    id: string,
    name: string,
  }>,
  removeKnownDevice: string => *,
  onStepEntered?: (number, Object) => void,
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
  toForget: Array<string>,
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
    toForget: [],
  };

  listingSubscription: *;

  componentDidMount() {
    this.listingSubscription = devicesObservable.subscribe({
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

  componentDidUpdate({ editMode: prevEditMode }: Props) {
    const { editMode } = this.props;
    if (prevEditMode && !editMode) {
      this.onResetToForget();
    }
  }

  componentWillUnmount() {
    this.listingSubscription.unsubscribe();
  }

  onForgetSelect = ({ id }) => {
    this.setState(state => {
      const newToForget = state.toForget.includes(id)
        ? state.toForget.filter(d => d !== id)
        : [...state.toForget, id];

      return {
        ...state,
        toForget: newToForget,
      };
    });
  };

  onResetToForget = () => {
    this.setState(state => ({ ...state, toForget: [] }));
  };

  onSelect = ({ id }) => {
    this.setState({ connecting: true, connectingId: id });
  };

  onDone = (id, meta) => {
    this.setState({ connecting: false }, () => {
      this.props.onSelect(id, meta);
    });
  };

  onCancel = () => {
    this.setState({ connecting: false });
  };

  renderItem = ({ item }: *) => (
    <DeviceItem
      key={item.id}
      device={item}
      onSelect={this.onSelect}
      onForgetSelect={this.props.editMode ? this.onForgetSelect : undefined}
      selected={this.state.toForget.includes(item.id)}
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
        <RemoveDeviceButton
          show={editMode}
          devices={this.state.toForget}
          reset={this.onResetToForget}
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
  }),
  {
    removeKnownDevice,
  },
)(SelectDevice);
