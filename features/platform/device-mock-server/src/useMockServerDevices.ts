import { useEffect, useState } from "react";
import { from, of, timer } from "rxjs";
import { catchError, exhaustMap } from "rxjs/operators";
import {
  listMockServerDevices,
  type MockServerConfig,
  type MockServerDevice,
} from "./mockServerApi";

const POLL_INTERVAL_MS = 2000;
const NO_DEVICES: readonly MockServerDevice[] = [];

const haveSameDevices = (a: readonly MockServerDevice[], b: readonly MockServerDevice[]) =>
  a.length === b.length &&
  a.every(
    (device, i) =>
      device.id === b[i].id &&
      device.name === b[i].name &&
      device.device_type === b[i].device_type &&
      device.connectivity_type === b[i].connectivity_type,
  );

export function useMockServerDevices(config: MockServerConfig | null): readonly MockServerDevice[] {
  const [devices, setDevices] = useState(NO_DEVICES);
  const url = config?.url;
  const token = config?.token;

  useEffect(() => {
    if (!url || !token) return;

    const subscription = timer(0, POLL_INTERVAL_MS)
      .pipe(
        exhaustMap(() =>
          from(listMockServerDevices({ url, token })).pipe(catchError(() => of(NO_DEVICES))),
        ),
      )
      .subscribe(serverDevices =>
        setDevices(prev => (haveSameDevices(prev, serverDevices) ? prev : serverDevices)),
      );

    return () => {
      subscription.unsubscribe();
      setDevices(NO_DEVICES);
    };
  }, [url, token]);

  return url && token ? devices : NO_DEVICES;
}
