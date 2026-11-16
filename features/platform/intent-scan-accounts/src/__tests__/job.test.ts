import type {
  DeviceConnectionResult,
  DeviceExtractedContext,
} from "@features/platform-device-intent";
import { Observable, Subject, take } from "rxjs";
import { createScanAccountsIntentDefinition } from "../definition";
import { scanAccountsIntentJob } from "../job";
import type { ScanAccountsIntentJobState, StartScan } from "../types";

type Item = { readonly id: string };

const deviceConnectionResult = {
  compatDeviceId: "compat-1",
} as DeviceConnectionResult;

const deviceExtractedContext = {} as DeviceExtractedContext;

function subjectScan() {
  const subject = new Subject<Item>();
  let unsubscribed = false;
  const startScan: StartScan<Item> = () =>
    new Observable(subscriber => {
      const inner = subject.subscribe(subscriber);
      return () => {
        unsubscribed = true;
        inner.unsubscribe();
      };
    });

  return {
    subject,
    startScan,
    wasUnsubscribed: () => unsubscribed,
  };
}

function run(startScan: StartScan<Item>, onResult?: (items: readonly Item[]) => void) {
  const states: ScanAccountsIntentJobState<Item>[] = [];
  const events: string[] = [];
  let result: readonly Item[] | undefined;
  let observableError: unknown;

  const subscription = scanAccountsIntentJob<Item>({
    deviceConnectionResult,
    deviceExtractedContext,
    input: { startScan },
    onResult: items => {
      onResult?.(items);
      events.push("result");
      result = items;
    },
  }).subscribe({
    next: state => {
      events.push(state.type);
      states.push(state);
    },
    error: error => {
      observableError = error;
      events.push("observable-error");
    },
    complete: () => {
      events.push("complete");
    },
  });

  return {
    states,
    events,
    subscription,
    getResult: () => result,
    getObservableError: () => observableError,
  };
}

function scanningStop(state: ScanAccountsIntentJobState<Item> | undefined): () => void {
  if (state?.type !== "scanning") {
    throw new Error("expected a scanning state");
  }
  return state.stop;
}

describe("scanAccountsIntentJob", () => {
  it("emits scanning as items arrive, then done, and reports them before completing", () => {
    const { subject, startScan } = subjectScan();
    const job = run(connection => {
      expect(connection).toBe(deviceConnectionResult);
      return startScan(connection);
    });

    subject.next({ id: "a" });
    subject.next({ id: "b" });
    subject.complete();

    expect(job.states[0]).toMatchObject({ type: "scanning", items: [] });
    expect(job.states[1]).toMatchObject({ type: "scanning", items: [{ id: "a" }] });
    expect(job.states[2]).toMatchObject({ type: "scanning", items: [{ id: "a" }, { id: "b" }] });
    expect(job.states[3]).toEqual({ type: "done", items: [{ id: "a" }, { id: "b" }] });
    expect(job.events).toEqual(["scanning", "scanning", "scanning", "result", "done", "complete"]);
    expect(job.getResult()).toEqual([{ id: "a" }, { id: "b" }]);
    expect(job.getObservableError()).toBeUndefined();
  });

  it("completes with no items when the scan finds none", () => {
    const { subject, startScan } = subjectScan();
    const job = run(startScan);

    subject.complete();

    expect(job.states.at(-1)).toEqual({ type: "done", items: [] });
    expect(job.getResult()).toEqual([]);
    expect(job.events).toEqual(["scanning", "result", "done", "complete"]);
  });

  it("stops with the items found so far and ignores anything after", () => {
    const { subject, startScan, wasUnsubscribed } = subjectScan();
    const job = run(startScan);

    subject.next({ id: "a" });
    scanningStop(job.states.at(-1))();
    subject.next({ id: "b" });

    expect(job.states.at(-1)).toEqual({ type: "done", items: [{ id: "a" }] });
    expect(job.getResult()).toEqual([{ id: "a" }]);
    expect(job.events.at(-3)).toBe("result");
    expect(job.events.at(-2)).toBe("done");
    expect(job.events.at(-1)).toBe("complete");
    expect(wasUnsubscribed()).toBe(true);
    expect(job.getObservableError()).toBeUndefined();
  });

  it("stops before any item and reports an empty list", () => {
    const { startScan, wasUnsubscribed } = subjectScan();
    const job = run(startScan);

    scanningStop(job.states[0])();

    expect(job.states.at(-1)).toEqual({ type: "done", items: [] });
    expect(job.getResult()).toEqual([]);
    expect(wasUnsubscribed()).toBe(true);
    expect(job.events.at(-1)).toBe("complete");
  });

  it("maps a scan failure to the error state and still completes", () => {
    const failure = new Error("device lost");
    const { subject, startScan } = subjectScan();
    const job = run(startScan);

    subject.next({ id: "a" });
    subject.error(failure);

    expect(job.states.at(-1)).toEqual({
      type: "error",
      error: failure,
      items: [{ id: "a" }],
    });
    expect(job.getResult()).toBeUndefined();
    expect(job.getObservableError()).toBeUndefined();
    expect(job.events).not.toContain("observable-error");
    expect(job.events.at(-1)).toBe("complete");
  });

  it("maps a non-Error failure to an Error", () => {
    const { subject, startScan } = subjectScan();
    const job = run(startScan);

    subject.error("nope");

    expect(job.states.at(-1)).toEqual({
      type: "error",
      error: new Error("nope"),
      items: [],
    });
    expect(job.getObservableError()).toBeUndefined();
    expect(job.events.at(-1)).toBe("complete");
  });

  it("maps a startScan throw to the error state", () => {
    const failure = new Error("missing bridge");
    const job = run(() => {
      throw failure;
    });

    expect(job.states.at(-1)).toEqual({
      type: "error",
      error: failure,
      items: [],
    });
    expect(job.getObservableError()).toBeUndefined();
    expect(job.events.at(-1)).toBe("complete");
  });

  it("emits a descriptor that has no string id", () => {
    const descriptor = { descriptor: { chain: "aleo", index: 0 } };
    const subject = new Subject<typeof descriptor>();
    const states: ScanAccountsIntentJobState<typeof descriptor>[] = [];
    let result: readonly (typeof descriptor)[] | undefined;

    scanAccountsIntentJob({
      deviceConnectionResult,
      deviceExtractedContext,
      input: { startScan: () => subject.asObservable() },
      onResult: items => {
        result = items;
      },
    }).subscribe(state => states.push(state));

    subject.next(descriptor);
    subject.complete();

    expect(states.at(-1)).toEqual({ type: "done", items: [descriptor] });
    expect(result).toEqual([descriptor]);
  });

  it("completes with an error state when onResult throws", () => {
    const failure = new Error("host failed");
    const { subject, startScan } = subjectScan();
    const job = run(startScan, () => {
      throw failure;
    });

    subject.next({ id: "a" });
    subject.complete();

    expect(job.states.at(-1)).toEqual({ type: "error", error: failure, items: [{ id: "a" }] });
    expect(job.getResult()).toBeUndefined();
    expect(job.getObservableError()).toBeUndefined();
    expect(job.events).not.toContain("done");
    expect(job.events.at(-1)).toBe("complete");
  });

  it("completes with an error state when onResult throws on stop", () => {
    const failure = new Error("host failed");
    const { startScan } = subjectScan();
    const job = run(startScan, () => {
      throw failure;
    });

    scanningStop(job.states[0])();

    expect(job.states.at(-1)).toEqual({ type: "error", error: failure, items: [] });
    expect(job.getObservableError()).toBeUndefined();
    expect(job.events).not.toContain("done");
    expect(job.events.at(-1)).toBe("complete");
  });

  it("does not start the scan when the subscriber closes during the first emission", () => {
    let started = false;
    const states: ScanAccountsIntentJobState<Item>[] = [];

    scanAccountsIntentJob<Item>({
      deviceConnectionResult,
      deviceExtractedContext,
      input: {
        startScan: () => {
          started = true;
          return new Observable(subscriber => {
            subscriber.next({ id: "a" });
            subscriber.complete();
          });
        },
      },
      onResult: () => undefined,
    })
      .pipe(take(1))
      .subscribe(state => states.push(state));

    expect(started).toBe(false);
    expect(states).toEqual([expect.objectContaining({ type: "scanning", items: [] })]);
  });

  it("does not report a result when the subscriber closes while a synchronous scan runs", () => {
    const onResult = jest.fn();
    const states: ScanAccountsIntentJobState<Item>[] = [];

    scanAccountsIntentJob<Item>({
      deviceConnectionResult,
      deviceExtractedContext,
      input: {
        startScan: () =>
          new Observable(subscriber => {
            subscriber.next({ id: "a" });
            subscriber.next({ id: "b" });
            subscriber.complete();
          }),
      },
      onResult,
    })
      .pipe(take(2))
      .subscribe(state => states.push(state));

    expect(onResult).not.toHaveBeenCalled();
    expect(states).toHaveLength(2);
    expect(states.at(-1)).toMatchObject({ type: "scanning", items: [{ id: "a" }] });
  });

  it("unsubscribes the scan when the job subscription ends", () => {
    const { startScan, wasUnsubscribed } = subjectScan();
    const job = run(startScan);

    job.subscription.unsubscribe();

    expect(wasUnsubscribed()).toBe(true);
    expect(job.getResult()).toBeUndefined();
    expect(job.events).not.toContain("complete");
  });
});

describe("createScanAccountsIntentDefinition", () => {
  it("requires a connected device and lets the executor handle the lock", () => {
    const definition = createScanAccountsIntentDefinition<Item>();

    expect(definition.label).toBe("Scan accounts");
    expect(definition.requiresConnectedDevice).toBe(true);
    expect(definition.delegateDeviceLockStateHandlingToExecutor).toBe(true);
    expect(definition.job).toBe(scanAccountsIntentJob);
  });
});
