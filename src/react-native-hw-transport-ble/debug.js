// @flow

import { Subject, Observable } from "rxjs";
import { shareReplay, map } from "rxjs/operators";

export type LogWithoutId = {
  type: string,
  message?: string,
};

export type Log = {
  id: number,
  date: Date,
} & LogWithoutId;

export const logSubject: Subject<LogWithoutId> = new Subject();

let id = 0;

export const logsObservable: Observable<Log> = logSubject.pipe(
  map(l => ({ id: ++id, date: new Date(), ...l })),
  shareReplay(500),
);

logsObservable.subscribe();
