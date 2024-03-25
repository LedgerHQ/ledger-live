import Transport from "@ledgerhq/hw-transport";
import { firstValueFrom, from, PartialObserver } from "rxjs";
import { take, first, filter } from "rxjs/operators";
import type { Device } from "@ledgerhq/types-devices";
import type { Observer as TransportObserver, DescriptorEvent } from "@ledgerhq/hw-transport";
import { HwTransportError } from "@ledgerhq/errors";
import type { ApduMock } from "../logic/createAPDUMock";
import { hookRejections } from "../logic/debugReject";
import { e2eBridgeClient } from "../../e2e/bridge/client";

export type DeviceMock = {
  id: string;
  name: string;
  apduMock: ApduMock;
};
type Opts = {
  createTransportDeviceMock: (id: string, name: string, serviceUUID: string) => DeviceMock;
};
const defaultOpts = {
  observeState: from([
    {
      type: "PoweredOn",
      available: true,
    },
  ]),
};
export default (opts: Opts) => {
  const { observeState, createTransportDeviceMock } = {
    ...defaultOpts,
    ...opts,
  };
  return class BluetoothTransportMock extends Transport {
    static isSupported = (): Promise<boolean> => Promise.resolve(true);
    static observeState = (o: PartialObserver<{ type: string; available: boolean }>) =>
      observeState.subscribe(o);
    static list = () => Promise.resolve([]);
    static disconnectDevice = (_id: string) => Promise.resolve();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    static setLogLevel = (_param: string) => {};

    static listen(observer: TransportObserver<DescriptorEvent<Device>, HwTransportError>) {
      return e2eBridgeClient
        .pipe(
          filter(msg => msg.type === "add"),
          take(3),
        )
        .subscribe(msg => {
          if (msg.type === "add") {
            observer.next({
              type: "add",
              descriptor: createTransportDeviceMock(
                msg.payload.id,
                msg.payload.name,
                msg.payload.serviceUUID,
              ),
              deviceModel: undefined,
            });
          }
        });
    }

    static async open(device: string | Device) {
      await firstValueFrom(
        e2eBridgeClient.pipe(
          filter(msg => msg.type === "open"),
          first(),
        ),
      );
      return new BluetoothTransportMock(
        typeof device === "string" ? createTransportDeviceMock(device, "", "") : device,
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

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setScrambleKey() {}

    close(): Promise<void> {
      return this.device.apduMock.close();
    }
  };
};
