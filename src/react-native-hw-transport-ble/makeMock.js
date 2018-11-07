// @flow

import Transport from "@ledgerhq/hw-transport";
import { from, Observable } from "rxjs";
import { delay } from "../logic/promise";
import type { ApduMock } from "../logic/createAPDUMock";
import { hookRejections, rejectionOp } from "../components/DebugRejectSwitch";

export type DeviceMock = {
  id: string,
  name: string,
  apduMock: ApduMock,
};

type Opts = {
  createTransportDeviceMock: (id: string, name: string) => DeviceMock,
};

const defaultOpts = {
  observeState: from([{ type: "PoweredOn", available: true }]),
};

export default (opts: Opts) => {
  const { observeState, createTransportDeviceMock } = {
    ...defaultOpts,
    ...opts,
  };

  return class BluetoothTransportMock extends Transport<DeviceMock | string> {
    static isSupported = (): Promise<boolean> => Promise.resolve(true);

    static observeState = (o: *) => observeState.subscribe(o);

    static list = () => Promise.resolve([]);

    static listen(observer: *) {
      return Observable.create(observer => {
        let timeout;

        const unsubscribe = () => {
          clearTimeout(timeout);
        };

        timeout = setTimeout(() => {
          observer.next({
            type: "add",
            descriptor: createTransportDeviceMock("mock_1", "Nano X de David"),
          });
          timeout = setTimeout(() => {
            observer.next({
              type: "add",
              descriptor: createTransportDeviceMock(
                "mock_2",
                "Nano X de Arnaud",
              ),
            });
            timeout = setTimeout(() => {
              observer.next({
                type: "add",
                descriptor: createTransportDeviceMock(
                  "mock_3",
                  "Nano X de Didier Duchmol",
                ),
              });
            }, 2000);
          }, 1000);
        }, 500);

        return unsubscribe;
      })
        .pipe(rejectionOp())
        .subscribe(observer);
    }

    static async open(device: *) {
      await hookRejections(delay(1000));
      return new BluetoothTransportMock(
        typeof device === "string"
          ? createTransportDeviceMock(device, "")
          : device,
      );
    }

    device: DeviceMock;

    constructor(device: DeviceMock) {
      super();
      this.device = device;
    }

    exchange(apdu: Buffer): Promise<Buffer> {
      return hookRejections(this.device.apduMock.exchange(apdu));
    }

    setScrambleKey() {}

    close(): Promise<void> {
      return this.device.apduMock.close();
    }
  };
};
