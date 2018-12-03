// @flow
import { Observable } from "rxjs";
import type { Characteristic } from "./types";
import { logSubject } from "./debug";

export const monitorCharacteristic = (c: Characteristic): Observable<Buffer> =>
  Observable.create(o => {
    logSubject.next({
      type: "verbose",
      message: "start monitor " + c.uuid,
    });
    const subscription = c.monitor((error, c) => {
      if (error) {
        logSubject.next({
          type: "verbose",
          message: "error monitor " + c.uuid + ": " + error,
        });
        o.error(error);
        return;
      }
      try {
        const value = Buffer.from(c.value, "base64");
        o.next(value);
      } catch (error) {
        o.error(error);
      }
    });

    return () => {
      logSubject.next({
        type: "verbose",
        message: "end monitor " + c.uuid,
      });
      subscription.remove();
    };
  });
