import { DeviceStatus, type DeviceSessionState } from "@ledgerhq/device-management-kit";
import { BehaviorSubject, Subject, type Observable } from "rxjs";

export type TestStream<T> = {
  events: Observable<T>;
  push(value: T): void;
  end(): void;
  fail(error: unknown): void;
  readonly watched: boolean;
};

export function createTestStream<T>(options?: { current: T }): TestStream<T> {
  const states = options === undefined ? new Subject<T>() : new BehaviorSubject<T>(options.current);

  return {
    events: states.asObservable(),
    push(value) {
      states.next(value);
    },
    end() {
      states.complete();
    },
    fail(error) {
      states.error(error);
    },
    get watched() {
      return states.observed;
    },
  };
}

export type SessionStream = TestStream<DeviceSessionState> & {
  set(deviceStatus: DeviceStatus): void;
};

export function createSessionStream(): SessionStream {
  const stream = createTestStream<DeviceSessionState>();

  return {
    ...stream,
    set(deviceStatus) {
      stream.push({ deviceStatus } as DeviceSessionState);
    },
    get watched() {
      return stream.watched;
    },
  };
}
