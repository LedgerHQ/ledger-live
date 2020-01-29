// @flow

import {
  Observable,
  Subject,
  merge,
  throwError,
  interval,
  concat,
  of
} from "rxjs";
import { mergeMap, take, map, ignoreElements } from "rxjs/operators";
import type { SocketEvent } from "../types/manager";

export const socketErrorSubject: Subject<*> = new Subject();

export const withSocketErrors = (
  observable: Observable<SocketEvent>
): Observable<SocketEvent> =>
  merge(observable, socketErrorSubject.pipe(mergeMap(e => throwError(e))));

const pause = ms => interval(ms).pipe(take(1), ignoreElements());

export const secureChannelMock = (
  managerGranted: boolean = false
): Observable<SocketEvent> =>
  !managerGranted
    ? concat(
        pause(500),
        of({
          type: "device-permission-requested",
          wording: "Allow Ledger manager"
        }),
        pause(500),
        of({
          type: "device-permission-granted"
        }),
        pause(500)
      )
    : pause(1000);

export const bulkSocketMock = (
  duration: number = 1000
): Observable<SocketEvent> => {
  const total = Math.floor((duration - 100) / 100);
  return interval(100).pipe(
    take(total + 1),
    map(index => ({
      type: "bulk-progress",
      progress: index / total,
      index,
      total
    }))
  );
};

export const resultMock = (payload: any): Observable<SocketEvent> =>
  of({ type: "result", payload });

export const createMockSocket = (
  ...observables: Array<Observable<SocketEvent>>
): Observable<SocketEvent> => withSocketErrors(concat(...observables));
