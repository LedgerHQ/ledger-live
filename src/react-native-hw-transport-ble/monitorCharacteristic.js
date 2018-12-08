// @flow
import { Observable } from "rxjs";
import { TransportError } from "@ledgerhq/hw-transport";
import type { Characteristic } from "./types";
import { logSubject } from "./debug";

export const monitorCharacteristic = (
  characteristic: Characteristic,
): Observable<Buffer> =>
  Observable.create(o => {
    logSubject.next({
      type: "verbose",
      message: "start monitor " + characteristic.uuid,
    });
    const subscription = characteristic.monitor((error, c) => {
      if (error) {
        logSubject.next({
          type: "verbose",
          message: "error monitor " + characteristic.uuid + ": " + error,
        });
        o.error(error);
      } else if (!c) {
        o.error(
          new TransportError(
            "characteristic monitor null value",
            "CharacteristicMonitorNull",
          ),
        );
      } else {
        try {
          const value = Buffer.from(c.value, "base64");
          o.next(value);
        } catch (error) {
          o.error(error);
        }
      }
    });

    return () => {
      logSubject.next({
        type: "verbose",
        message: "end monitor " + characteristic.uuid,
      });
      subscription.remove();
    };
  });
