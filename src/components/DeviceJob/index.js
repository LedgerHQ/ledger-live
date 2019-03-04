// @flow

import React, { Component } from "react";
import { Observable, Subject, from } from "rxjs";
import debounce from "lodash/debounce";
import { mergeMap, last, tap, filter } from "rxjs/operators";
import StepRunnerModal from "./StepRunnerModal";
import type { Step, DeviceMeta } from "./types";

const runStep = (
  step: Step,
  meta: Object,
  onDoneO: Observable<*>,
): Observable<Object> => step.run(meta, onDoneO);

const chainSteps = (
  steps: Step[],
  meta: DeviceMeta,
  onStepEnter: (number, Object) => void,
  onDoneO: Observable<number>,
): Observable<Object> =>
  steps.reduce(
    (meta: Observable<*>, step: Step, i: number) =>
      meta.pipe(
        tap(meta => onStepEnter(i, meta)),
        mergeMap(meta =>
          runStep(step, meta, onDoneO.pipe(filter(index => index === i))),
        ),
        last(),
      ),
    from([meta]),
  );

class DeviceJob extends Component<
  {
    // as soon as meta is set, the DeviceJob starts
    meta: ?DeviceMeta,
    steps: Step[],
    onDone: Object => void,
    onCancel: () => void,
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
    const { meta } = this.props;
    if (meta) {
      this.onStart(meta);
    }
  }

  componentDidUpdate(prevProps: *) {
    const { meta } = this.props;
    if (meta !== prevProps.meta) {
      if (meta) {
        this.onStart(meta);
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

  onStart = (meta: DeviceMeta) => {
    this.debouncedSetStepIndex.cancel();
    if (this.sub) this.sub.unsubscribe();

    if (this.props.steps.length === 0) {
      this.props.onDone(meta);
      return;
    }

    this.setState({
      connecting: true,
      error: null,
      stepIndex: 0,
      meta,
    });

    this.sub = chainSteps(
      this.props.steps,
      meta,
      this.onStepEntered,
      this.onDoneSubject,
    ).subscribe({
      next: meta => {
        this.debouncedSetStepIndex.cancel();
        this.setState({ connecting: false }, () => {
          this.props.onDone(meta);
        });
      },
      error: error => {
        this.setState({ error });
      },
    });
  };

  onRetry = () => {
    const { meta } = this.props;
    const { connecting, error } = this.state;
    if (connecting && error && meta) {
      this.onStart(meta);
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
    const { steps, meta } = this.props;
    const { connecting, stepIndex, error } = this.state;
    const step = steps[stepIndex];
    if (!step || !meta) return null;
    return (
      <StepRunnerModal
        isOpened={connecting}
        onClose={this.onClose}
        onRetry={this.onRetry}
        step={step}
        onStepDone={this.onStepDone}
        error={error}
        meta={meta}
      />
    );
  }
}

export default DeviceJob;
