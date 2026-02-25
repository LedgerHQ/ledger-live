import { tap } from "rxjs";
import type {
  DeviceAction,
  DeviceActionIntermediateValue,
  DeviceActionState,
  DmkError,
  InternalApi,
  ExecuteDeviceActionReturnType,
} from "@ledgerhq/device-management-kit";
import { DeviceActionStatus } from "@ledgerhq/device-management-kit";

type TraceEntry<Output, Error, IntermediateValue> = {
  readonly timestamp: number;
  readonly elapsed: number;
  readonly status: string;
  readonly intermediateValue?: IntermediateValue;
  readonly output?: Output;
  readonly error?: Error;
};

/**
 * A generic tracer that wraps any DeviceAction's `tracedExecute` to record
 * every state transition. Attach it only when needed (debugging, tests).
 *
 * @example
 * ```ts
 * const action = new ConnectAppDeviceAction({ input: { ... } });
 * const tracer = new DeviceActionTracer(action);
 *
 * // Use tracedExecute instead of action._execute
 * const { observable, cancel } = tracer.tracedExecute(internalApi);
 * observable.subscribe({ ... });
 *
 * // After completion:
 * tracer.printTrace();        // human-readable console output
 * tracer.dumpTraceJSON();     // JSON string for saving to file
 * console.log(tracer.trace);  // raw array of trace entries
 * ```
 */
export class DeviceActionTracer<
  Output,
  Input,
  Error extends DmkError,
  IntermediateValue extends DeviceActionIntermediateValue,
> {
  private readonly _trace: Array<TraceEntry<Output, Error, IntermediateValue>> = [];
  private readonly _startTime: number;
  private readonly _deviceAction: DeviceAction<Output, Input, Error, IntermediateValue>;
  private readonly _label: string;

  constructor(deviceAction: DeviceAction<Output, Input, Error, IntermediateValue>, label?: string) {
    this._deviceAction = deviceAction;
    this._label = label ?? deviceAction.constructor.name;
    this._startTime = Date.now();
  }

  /**
   * Read-only access to the collected trace entries.
   */
  get trace(): ReadonlyArray<TraceEntry<Output, Error, IntermediateValue>> {
    return this._trace;
  }

  /**
   * Wraps `_execute` — use this instead of calling `deviceAction._execute()` directly.
   * The returned observable is identical but also records every emitted state.
   */
  tracedExecute(
    internalApi: InternalApi,
  ): ExecuteDeviceActionReturnType<Output, Error, IntermediateValue> {
    const { observable, cancel } = this._deviceAction._execute(internalApi);

    const traced = observable.pipe(
      tap(state => {
        this._record(state);
      }),
    );

    return { observable: traced, cancel };
  }

  /**
   * Print a compact human-readable trace to console.
   *
   * Example output:
   *   [DeviceActionTracer: ConnectAppDeviceAction]
   *   +0ms    pending  (interaction: None)
   *   +52ms   pending  (interaction: UnlockDevice)
   *   +1204ms pending  (interaction: None)
   *   +1205ms completed
   */
  printTrace(): void {
    console.log(`[DeviceActionTracer: ${this._label}]`);
    for (const entry of this._trace) {
      const parts = [`+${entry.elapsed}ms`, entry.status];

      if (entry.intermediateValue) {
        parts.push(`(interaction: ${entry.intermediateValue.requiredUserInteraction})`);
      }
      if (entry.output !== undefined) {
        parts.push(JSON.stringify(entry.output));
      }
      if (entry.error !== undefined) {
        parts.push(JSON.stringify(entry.error));
      }

      console.log(`  ${parts.join("\t")}`);
    }
  }

  /**
   * Returns the full trace as a formatted JSON string.
   * Useful for saving to a file or attaching to test reports.
   */
  dumpTraceJSON(): string {
    return JSON.stringify(
      {
        label: this._label,
        startTime: new Date(this._startTime).toISOString(),
        entries: this._trace,
      },
      null,
      2,
    );
  }

  /**
   * Returns a one-line summary: the sequence of statuses.
   * e.g. "pending → pending → pending → completed"
   */
  get summary(): string {
    return this._trace.map(e => e.status).join(" → ");
  }

  private _record(state: DeviceActionState<Output, Error, IntermediateValue>): void {
    const now = Date.now();
    const base = {
      timestamp: now,
      elapsed: now - this._startTime,
      status: state.status,
    };

    switch (state.status) {
      case DeviceActionStatus.Pending:
        this._trace.push({ ...base, intermediateValue: state.intermediateValue });
        break;
      case DeviceActionStatus.Completed:
        this._trace.push({ ...base, output: state.output });
        break;
      case DeviceActionStatus.Error:
        this._trace.push({ ...base, error: state.error });
        break;
      default:
        this._trace.push(base);
        break;
    }
  }
}
