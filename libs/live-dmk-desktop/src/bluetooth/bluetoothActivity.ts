import { BehaviorSubject, type Observable } from "rxjs";
import type { SendApduResult } from "@ledgerhq/device-management-kit";

/** Test-phase observability of the Bluetooth link: what the device actually received and answered. */
export type BluetoothActivity = {
  readonly deviceName: string | null;
  readonly isConnected: boolean;
  readonly apdusSent: number;
  readonly responsesReceived: number;
  /** Status word of the last response, e.g. "9000" for success. */
  readonly lastStatusWord: string | null;
  readonly lastExchangeAt: Date | null;
  readonly lastError: string | null;
};

const INITIAL_ACTIVITY: BluetoothActivity = {
  deviceName: null,
  isConnected: false,
  apdusSent: 0,
  responsesReceived: 0,
  lastStatusWord: null,
  lastExchangeAt: null,
  lastError: null,
};

const activitySubject = new BehaviorSubject<BluetoothActivity>(INITIAL_ACTIVITY);

const update = (patch: Partial<BluetoothActivity>): void => {
  activitySubject.next({ ...activitySubject.getValue(), ...patch });
};

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");

export const bluetoothActivity$: Observable<BluetoothActivity> = activitySubject.asObservable();

export const getBluetoothActivity = (): BluetoothActivity => activitySubject.getValue();

export const recordConnected = (deviceName: string): void =>
  update({ deviceName, isConnected: true, lastError: null });

export const recordDisconnected = (): void => update({ isConnected: false });

export const recordApduSent = (): void =>
  update({ apdusSent: activitySubject.getValue().apdusSent + 1 });

export const recordApduResult = (result: SendApduResult): void =>
  result.caseOf({
    Left: error => update({ lastError: error._tag, lastExchangeAt: new Date() }),
    Right: response =>
      update({
        responsesReceived: activitySubject.getValue().responsesReceived + 1,
        lastStatusWord: toHex(response.statusCode),
        lastExchangeAt: new Date(),
        lastError: null,
      }),
  });
