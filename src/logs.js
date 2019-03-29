// @flow

import { Subject, Observable } from "rxjs";
import { shareReplay, map } from "rxjs/operators";

export type LogWithoutId = {
  type: string,
  message?: string
};

export type Log = {
  id: string,
  date: Date
} & LogWithoutId;

export const logsSubject: Subject<LogWithoutId> = new Subject();

export const log = (type: string, message?: string) =>
  logsSubject.next({ type, message });

let id = 0;

export const logsObservable: Observable<Log> = logsSubject.pipe(
  map(l => ({ id: String(++id), date: new Date(), ...l })),
  shareReplay(1000)
);

logsObservable.subscribe(e => {
  if (global.__ledgerDebug) {
    global.__ledgerDebug(
      e.date.toISOString() + " " + e.type + ": " + String(e.message)
    );
  }
});
