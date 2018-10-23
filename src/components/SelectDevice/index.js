// @flow

// TODO
// - try to use React Suspense to debounce the UI
// - implement the auto-retry AND retry mecanism in the steps
// - integrate the UI

import React, { Component, Fragment } from "react";
import { FlatList, StyleSheet } from "react-native";
import { Observable, from } from "rxjs";
import { mergeMap, last, tap } from "rxjs/operators";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type Transport from "@ledgerhq/hw-transport";
import { open, devicesObservable } from "../../logic/hw";
import { knownDevicesSelector } from "../../reducers/ble";
import { removeKnownDevice } from "../../actions/ble";
import DeviceItem from "../DeviceItem";
import ScanningFooter from "./ScanningFooter";
import SelectDeviceConnectModal from "./SelectDeviceConnectModal";
import type { Step } from "./types";
import { connectingStep } from "./steps";

const runStep = (
  step: Step,
  transport: Transport<*>,
  meta: Object,
): Observable<Object> => step.run(transport, meta);

const chainSteps = (
  steps: Step[],
  transport: Transport<*>,
  onStepPass: number => void,
): Observable<Object> =>
  steps.reduce(
    (meta: Observable<*>, step: Step, i: number) =>
      meta.pipe(
        mergeMap(meta =>
          // $FlowFixMe figure it out
          runStep(step, transport, meta)
            .pipe(last())
            .pipe(tap(() => onStepPass(i))),
        ),
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
    stepIndex: -1,
    error: null,
    meta: {},
  };

  selectSubscription: *;

  componentDidMount() {
    devicesObservable.subscribe({
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
              : devices.filter(d => d.id === e.id),
        })),
    });
  }

  componentWillUnmount() {
    if (this.selectSubscription) this.selectSubscription.unsubscribe();
  }

  onForget = async ({ id }) => {
    this.props.removeKnownDevice(id);
  };

  onSelect = ({ id }) => {
    this.setState({
      connecting: true,
      connectingId: id,
      error: null,
      stepIndex: -1,
      meta: {},
    });

    this.selectSubscription = from(open(id))
      .pipe(
        mergeMap(transport =>
          chainSteps(this.props.steps, transport, stepIndex =>
            this.setState({ stepIndex }),
          ).pipe(
            // close transport and returns meta
            mergeMap(meta =>
              from(transport.close().then(() => meta, () => meta)),
            ),
          ),
        ),
      )
      .subscribe({
        next: meta => {
          this.setState({ connecting: false });
          this.props.onSelect(id, meta);
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
    const { devices, connecting, stepIndex, error } = this.state;

    // $FlowFixMe
    const data = devices.concat(knownDevices);

    return (
      <Fragment>
        <FlatList
          contentContainerStyle={styles.root}
          data={data}
          renderItem={this.renderItem}
          ListFooterComponent={ScanningFooter}
          keyExtractor={this.keyExtractor}
        />
        <SelectDeviceConnectModal
          isOpened={connecting}
          onClose={this.onRequestClose}
          onRetry={this.onRetry}
          step={steps[stepIndex] || connectingStep}
          error={error}
        />
      </Fragment>
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
