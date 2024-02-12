import { Observable } from "rxjs";
import { TransportError } from "@ledgerhq/errors";
import type { Characteristic } from "./types";
import { LocalTracer, TraceContext } from "@ledgerhq/logs";

const LOG_TYPE = "ble-verbose";

export const monitorCharacteristic = (
  characteristic: Characteristic,
  context?: TraceContext,
): Observable<Buffer> =>
  new Observable(o => {
    const tracer = new LocalTracer(LOG_TYPE, context);
    tracer.trace(`Start monitoring BLE characteristics`, {
      characteristicUuid: characteristic.uuid,
    });

    const subscription = characteristic.monitor((error, c) => {
      if (error) {
        tracer.trace("Error while monitoring characteristics", { error });
        o.error(error);
      } else if (!c) {
        tracer.trace("BLE monitored characteristic null value");
        o.error(
          new TransportError("Characteristic monitor null value", "CharacteristicMonitorNull"),
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
      subscription.remove();
    };
  });
