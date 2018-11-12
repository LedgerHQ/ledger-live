// @flow

// TODO
// - try to use React Suspense to debounce the UI
// - implement the auto-retry AND retry mecanism in the steps
// - integrate the UI

import React, { Component, Fragment } from "react";
import { FlatList, StyleSheet } from "react-native";
import { Observable, Subject, from } from "rxjs";
import debounce from "lodash/debounce";
import { mergeMap, last, tap, filter } from "rxjs/operators";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { devicesObservable } from "../../logic/hw";
import { knownDevicesSelector } from "../../reducers/ble";
import { removeKnownDevice } from "../../actions/ble";
import DeviceItem from "../DeviceItem";
import Header from "./Header";
import Footer from "./Footer";
import SelectDeviceConnectModal from "./SelectDeviceConnectModal";
import type { Step } from "./types";

const runStep = (
  step: Step,
  deviceId: string,
  meta: Object,
  onDoneO: Observable<*>,
): Observable<Object> => step.run(deviceId, meta, onDoneO);

const chainSteps = (
  steps: Step[],
  deviceId: string,
  onStepEnter: (number, Object) => void,
  onDoneO: Observable<number>,
): Observable<Object> =>
  steps.reduce(
    (meta: Observable<*>, step: Step, i: number) =>
      meta.pipe(
        tap(meta => onStepEnter(i, meta)),
        mergeMap(meta =>
          runStep(
            step,
            deviceId,
            meta,
            onDoneO.pipe(filter(index => index === i)),
          ),
        ),
        last(),
      ),
    from([{}]),
  );

class SelectDevice extends Component<
  {
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
  },
  {
    devices: Array<{
      id: string,
      name: string,
      family: string,
    }>,
    scanning: boolean,
    connecting: boolean,
    connectingId: ?string,
    meta: Object,
    error: ?Error,
    stepIndex: number,
  },
> {
  static defaultProps = {
    steps: [],
  };

  state = {
    devices: [],
    scanning: true,
    connecting: false,
    connectingId: null,
    stepIndex: 0,
    error: null,
    meta: {},
  };

  selectSubscription: *;

  listingSubscription: *;

  onDoneSubject = new Subject();

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

  componentWillUnmount() {
    this.debouncedSetStepIndex.cancel();
    if (this.selectSubscription) this.selectSubscription.unsubscribe();
    this.listingSubscription.unsubscribe();
  }

  onForget = async ({ id }) => {
    this.props.removeKnownDevice(id);
  };

  debouncedSetStepIndex = debounce(stepIndex => {
    this.setState({ stepIndex });
  }, 500);

  onStepEntered = (stepIndex, meta) => {
    this.debouncedSetStepIndex(stepIndex);
    const { onStepEntered } = this.props;
    if (onStepEntered) onStepEntered(stepIndex, meta);
  };

  onStepDone = () => {
    this.onDoneSubject.next(this.state.stepIndex);
  };

  onSelect = ({ id }) => {
    this.setState({
      connecting: true,
      connectingId: id,
      error: null,
      stepIndex: 0,
      meta: {},
    });

    this.debouncedSetStepIndex.cancel();
    if (this.selectSubscription) this.selectSubscription.unsubscribe();
    this.selectSubscription = chainSteps(
      this.props.steps,
      id,
      this.onStepEntered,
      this.onDoneSubject,
    ).subscribe({
      next: meta => {
        this.debouncedSetStepIndex.cancel();
        this.setState({ connecting: false }, () => {
          this.props.onSelect(id, meta);
        });
      },
      error: error => {
        this.setState({ error });
      },
    });
  };

  onRetry = () => {
    const { connectingId, connecting, error } = this.state;
    if (connecting && error && connectingId) {
      this.onSelect({ id: connectingId });
    }
  };

  onRequestClose = () => {
    this.debouncedSetStepIndex.cancel();
    if (this.selectSubscription) this.selectSubscription.unsubscribe();
    this.setState({ connecting: false, error: null });
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
    const { knownDevices, steps } = this.props;
    const { devices, connecting, connectingId, stepIndex, error } = this.state;

    const connectingDevice = devices.find(d => d.id === connectingId);

    // $FlowFixMe
    const data = devices.concat(knownDevices);

    return (
      <Fragment>
        <FlatList
          contentContainerStyle={styles.root}
          data={data}
          renderItem={this.renderItem}
          ListHeaderComponent={Header}
          ListFooterComponent={Footer}
          keyExtractor={this.keyExtractor}
        />
        <SelectDeviceConnectModal
          deviceName={connectingDevice ? connectingDevice.name : ""}
          isOpened={connecting}
          onClose={this.onRequestClose}
          onRetry={this.onRetry}
          step={steps[stepIndex]}
          onStepDone={this.onStepDone}
          error={error}
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
