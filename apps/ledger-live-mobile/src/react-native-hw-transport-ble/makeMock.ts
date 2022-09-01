import Transport from "@ledgerhq/hw-transport";
import { from } from "rxjs";
import { take, first, filter } from "rxjs/operators";
import type { Device } from "@ledgerhq/react-native-hw-transport-ble/lib/types";
import type {
  Observer as TransportObserver,
  DescriptorEvent,
} from "@ledgerhq/hw-transport";
import type { ApduMock } from "../logic/createAPDUMock";
import { hookRejections } from "../logic/debugReject";
import { e2eBridgeSubject } from "../../e2e/bridge/client";

export type DeviceMock = {
  id: string;
  name: string;
  apduMock: ApduMock;
};
type Opts = {
  createTransportDeviceMock: (id: string, name: string) => DeviceMock;
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
  // $FlowFixMe
  const { observeState, createTransportDeviceMock } = {
    ...defaultOpts,
    ...opts,
  };
  return class BluetoothTransportMock extends Transport {
    static isSupported = (): Promise<boolean> => Promise.resolve(true);
    static observeState = (o: any) => observeState.subscribe(o);
    static list = () => Promise.resolve([]);
    static disconnect = (_id: string) => Promise.resolve();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    static setLogLevel = (_param: string) => {};

    static listen(observer: TransportObserver<DescriptorEvent<Device>>) {
      return e2eBridgeSubject
        .pipe(
          filter(msg => msg.type === "add"),
          take(3),
        )
        .subscribe(msg => {
          observer.next({
            type: msg.type,
            descriptor: createTransportDeviceMock(
              msg.payload.id,
              msg.payload.name,
            ),
          });
        });
    }

    static async open(device: any) {
      await e2eBridgeSubject
        .pipe(
          filter(msg => msg.type === "open"),
          first(),
        )
        .toPromise();
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

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setScrambleKey() {}

    close(): Promise<void> {
      return this.device.apduMock.close();
    }
  };
};
