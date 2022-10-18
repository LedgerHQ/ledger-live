import React, { Component } from "react";
import { Observable, Subject, from, Observer, Subscription } from "rxjs";
import debounce from "lodash/debounce";
import { mergeMap, last, tap, filter } from "rxjs/operators";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { DeviceModelId } from "@ledgerhq/devices";
import StepRunnerModal from "./StepRunnerModal";
import type { Step } from "./types";

const runStep = (
  step: Step,
  meta: Device & Record<string, unknown>,
  onDoneO: Observable<unknown>,
): Observable<Record<string, unknown>> => step.run(meta, onDoneO);

type StepEvent =
  | {
      type: "step";
      step: number;
      meta: Device & Record<string, unknown>;
    }
  | {
      type: "meta";
      meta: Device & Record<string, unknown>;
    };

const chainSteps = (
  steps: Step[],
  meta: Device,
  onDoneO: Observable<number>,
): Observable<StepEvent> =>
  Observable.create((o: Observer<unknown>) => {
    const obs: Observable<unknown> = steps.reduce(
      (meta: Observable<unknown>, step: Step, i: number) =>
        meta.pipe(
          tap(meta => {
            // we emit entering a new step
            o.next({
              type: "step",
              step: i,
              meta,
            });
          }),
          mergeMap(
            (
              meta, // for a given step, we chain the previous step result in. we also provide events of onDone taps (allow to interrupt the UI).
            ) =>
              runStep(
                step,
                meta as Device & Record<string, unknown>,
                onDoneO.pipe(filter(index => index === i)),
              ),
          ),
          tap(meta => {
            // we need to emit globally the meta incremental updates
            o.next({
              type: "meta",
              meta,
            });
          }),
          last(), // at the end, we only care about the last meta
        ),
      from([meta]),
    );
    const sub = obs.subscribe({
      complete: () => {
        o.complete();
      },
      error: e => {
        o.error(e);
      },
    });
    return () => {
      sub.unsubscribe();
    };
  });

type Props = {
  // as soon as meta is set, the DeviceJob starts
  meta: Device | null | undefined;
  steps: Step[];
  onDone: (arg0: Record<string, unknown>) => void;
  onCancel: () => void;
  editMode?: boolean;
  deviceModelId: DeviceModelId;
  onStepEntered?: (arg0: number, arg1: Record<string, unknown>) => void;
};

class DeviceJob extends Component<
  Props,
  {
    meta: Record<string, unknown> | null | undefined;
    error: Error | null | undefined;
    stepIndex: number;
  }
> {
  static defaultProps = {
    steps: [],
  };
  state = {
    stepIndex: 0,
    error: null,
    meta: null,
  };
  sub: Subscription | undefined;
  onDoneSubject: Subject<number> = new Subject();

  componentDidMount() {
    const { meta } = this.props;

    if (meta) {
      this.onStart(meta);
    }
  }

  componentDidUpdate(prevProps: Props) {
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
    this.setState({
      stepIndex,
    });
  }, 1000);
  onStepDone = () => {
    this.onDoneSubject.next(this.state.stepIndex);
  };
  onStart = (metaInput: Device) => {
    this.debouncedSetStepIndex.cancel();
    if (this.sub) this.sub.unsubscribe();
    let meta = metaInput;

    if (this.props.steps.length === 0) {
      this.props.onDone(meta);
      return;
    }

    this.setState({
      error: null,
      stepIndex: 0,
      meta,
    });
    this.sub = chainSteps(this.props.steps, meta, this.onDoneSubject).subscribe(
      {
        complete: () => {
          this.debouncedSetStepIndex.cancel();
          this.setState(
            {
              meta: null,
            },
            () => {
              this.props.onDone(meta);
            },
          );
        },
        next: e => {
          meta = e.meta;
          this.setState({
            meta,
          }); // refresh the UI

          if (e.type === "step") {
            this.debouncedSetStepIndex(e.step);
            const { onStepEntered } = this.props;
            if (onStepEntered) onStepEntered(e.step, e.meta);
          }
        },
        error: error => {
          this.setState({
            error,
          });
        },
      },
    );
  };
  onRetry = () => {
    const { meta } = this.props;
    const { error } = this.state;

    if (error && meta) {
      this.onStart(meta);
    }
  };
  onClose = () => {
    this.debouncedSetStepIndex.cancel();
    if (this.sub) this.sub.unsubscribe();
    this.setState(
      {
        meta: null,
        error: null,
      },
      () => {
        this.props.onCancel();
      },
    );
  };

  render() {
    const { steps, deviceModelId } = this.props;
    const { stepIndex, error, meta } = this.state;
    const step = steps[stepIndex];
    if (!step) return null;
    return (
      <StepRunnerModal
        onClose={this.onClose}
        onRetry={this.onRetry}
        step={step}
        onStepDone={this.onStepDone}
        error={error}
        meta={meta}
        deviceModelId={deviceModelId}
      />
    );
  }
}

export default DeviceJob;
