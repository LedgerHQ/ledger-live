// @flow

import { Observable, from, defer } from "rxjs";
import { mergeMap } from "rxjs/operators";
import type Transport from "@ledgerhq/hw-transport";
import { CantOpenDevice } from "@ledgerhq/live-common/lib/errors";
import { open } from ".";

const transportCleanup = (transport: Transport<*>) => <T>(
  observable: Observable<T>,
): Observable<T> =>
  Observable.create(o => {
    let done = false;
    const sub = observable.subscribe({
      next: e => o.next(e),
      complete: () => {
        done = true;
        transport
          .close()
          .catch(() => {})
          .then(() => o.complete());
      },
      error: e => {
        done = true;
        transport
          .close()
          .catch(() => {})
          .then(() => o.error(e));
      },
    });
    return () => {
      sub.unsubscribe();
      if (!done) transport.close();
    };
  });

export const withDevice = (deviceId: string) => <T>(
  job: (t: Transport<*>) => Observable<T>,
): Observable<T> =>
  defer(() =>
    from(
      open(deviceId).catch(e => {
        throw new CantOpenDevice(e.message);
      }),
    ),
  ).pipe(
    mergeMap(transport => job(transport).pipe(transportCleanup(transport))),
  );
