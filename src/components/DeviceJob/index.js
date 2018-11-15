// @flow

import React, { Component } from "react";
import { Observable, Subject, from } from "rxjs";
import debounce from "lodash/debounce";
import { mergeMap, last, tap, filter } from "rxjs/operators";
import StepRunnerModal from "./StepRunnerModal";
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

class DeviceJob extends Component<
  {
    // as soon as deviceId is set, the DeviceJob starts
    deviceId: ?string,
    steps: Step[],
    onDone: (string, Object) => void,
    onCancel: () => void,
    deviceName: ?string,
    editMode?: boolean,
    onStepEntered?: (number, Object) => void,
  },
  {
    connecting: boolean,
    meta: Object,
    error: ?Error,
    stepIndex: number,
  },
> {
  static defaultProps = {
    steps: [],
  };

  state = {
    connecting: false,
    stepIndex: 0,
    error: null,
    meta: {},
  };

  sub: *;

  onDoneSubject = new Subject();

  componentDidMount() {
    const { deviceId } = this.props;
    if (deviceId) {
      this.onStart(deviceId);
    }
  }

  componentDidUpdate(prevProps: *) {
    const { deviceId } = this.props;
    if (deviceId !== prevProps.deviceId) {
      if (deviceId) {
        this.onStart(deviceId);
      } else {
        this.debouncedSetStepIndex.cancel();
        if (this.sub) this.sub.unsubscribe();
      }
    }
  }

  componentWillUnmount() {
    this.debouncedSetStepIndex.cancel();
    if (this.sub) this.sub.unsubscribe();
  }

  debouncedSetStepIndex = debounce(stepIndex => {
    this.setState({ stepIndex });
  }, 500);

  onStepEntered = (stepIndex: number, meta: Object) => {
    this.debouncedSetStepIndex(stepIndex);
    const { onStepEntered } = this.props;
    if (onStepEntered) onStepEntered(stepIndex, meta);
  };

  onStepDone = () => {
    this.onDoneSubject.next(this.state.stepIndex);
  };

  onStart = (deviceId: string) => {
    this.setState({
      connecting: true,
      error: null,
      stepIndex: 0,
      meta: {},
    });

    this.debouncedSetStepIndex.cancel();
    if (this.sub) this.sub.unsubscribe();
    this.sub = chainSteps(
      this.props.steps,
      deviceId,
      this.onStepEntered,
      this.onDoneSubject,
    ).subscribe({
      next: meta => {
        this.debouncedSetStepIndex.cancel();
        this.setState({ connecting: false }, () => {
          this.props.onDone(deviceId, meta);
        });
      },
      error: error => {
        this.setState({ error });
      },
    });
  };

  onRetry = () => {
    const { deviceId } = this.props;
    const { connecting, error } = this.state;
    if (connecting && error && deviceId) {
      this.onStart(deviceId);
    }
  };

  onClose = () => {
    this.debouncedSetStepIndex.cancel();
    if (this.sub) this.sub.unsubscribe();
    this.setState({ connecting: false, error: null }, () => {
      this.props.onCancel();
    });
  };

  render() {
    const { steps, deviceName } = this.props;
    const { connecting, stepIndex, error } = this.state;
    return (
      <StepRunnerModal
        isOpened={connecting}
        onClose={this.onClose}
        onRetry={this.onRetry}
        step={steps[stepIndex]}
        onStepDone={this.onStepDone}
        error={error}
        deviceName={deviceName}
      />
    );
  }
}

export default DeviceJob;
