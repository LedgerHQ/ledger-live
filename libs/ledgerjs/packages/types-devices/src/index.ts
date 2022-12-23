/**
 * DeviceModelId is a unique identifier to identify the model of a Ledger hardware wallet.
 */
export enum DeviceModelId {
  blue = "blue",
  nanoS = "nanoS",
  nanoSP = "nanoSP",
  nanoX = "nanoX",
  stax = "stax",
}
/**
 * a DeviceModel contains all the information of a specific Ledger hardware wallet model.
 */
export interface DeviceModel {
  id: DeviceModelId;
  productName: string;
  productIdMM: number;
  legacyUsbProductId: number;
  usbOnly: boolean;
  memorySize: number;
  masks: number[];
  getBlockSize: (firmwareVersion: string) => number;
  bluetoothSpec?: {
    serviceUuid: string;
    writeUuid: string;
    writeCmdUuid: string;
    notifyUuid: string;
  }[];
}

/**
 *
 */
export enum ChargingModes {
  NONE = 0x00,
  USB = 0x01,
  QI = 0x02,
}

/**
 * Series of flags to represent the health status of the Ledger hardware wallet battery.
 */
export interface BatteryStatusFlags {
  charging: ChargingModes;
  issueCharging: boolean;
  issueTemperature: boolean;
  issueBattery: boolean;
}

/**
 *
 */
export interface BluetoothInfos {
  deviceModel: DeviceModel;
  serviceUuid: string;
  writeUuid: string;
  writeCmdUuid: string;
  notifyUuid: string;
}
/**
 * represent an ongoing job that can be stopped with .unsubscribe()
 */
export type Subscription = {
  unsubscribe: () => void;
};

/**
 * data about the device. not yet typed
 */
export type Device = any; // Should be a union type of all possible Device object's shape

export interface DescriptorEvent<Descriptor> {
  type: "add" | "remove";
  descriptor: Descriptor;
  deviceModel?: DeviceModel | null | undefined;
  device?: Device;
}

/**
 */
export type Observer<Ev> = Readonly<{
  next: (event: Ev) => unknown;
  error: (e: any) => unknown;
  complete: () => unknown;
}>;

export interface Transport {
  deviceModel: DeviceModel | null | undefined;

  exchange: (apdu: Buffer) => Promise<Buffer>;
  close: () => Promise<void>;
  setScrambleKey: (key: string) => void;

  /**
   * wrapper on top of exchange to simplify work of the implementation.
   * @param cla
   * @param ins
   * @param p1
   * @param p2
   * @param data
   * @param statusList is a list of accepted status code (shorts). [0x9000] by default
   * @return a Promise of response buffer
   */
  send: (
    cla: number,
    ins: number,
    p1: number,
    p2: number,
    data?: Buffer,
    statusList?: Array<number>
  ) => Promise<Buffer>;

  /**
   * Listen to an event on an instance of transport.
   * Transport implementation can have specific events. Here is the common events:
   * * `"disconnect"` : triggered if Transport is disconnected
   */
  on: (eventName: string, cb: (...args: Array<any>) => any) => void;

  /**
   * Stop listening to an event on an instance of transport.
   */
  off: (eventName: string, cb: (...args: Array<any>) => any) => void;
  emit: (event: string, ...args: any) => void;

  /**
   * Set a timeout (in milliseconds) for the exchange call. Only some transport might implement it. (e.g. U2F)
   */
  setExchangeTimeout: (exchangeTimeout: number) => void;

  /**
   * Define the delay before emitting "unresponsive" on an exchange that does not respond
   */
  setExchangeUnresponsiveTimeout: (unresponsiveTimeout: number) => void;

  exchangeAtomicImpl: (
    f: () => Promise<Buffer | void>
  ) => Promise<Buffer | void>;

  decorateAppAPIMethods: (
    self: Record<string, any>,
    methods: Array<string>,
    scrambleKey: string
  ) => void;

  decorateAppAPIMethod: <R, A extends any[]>(
    methodName: string,
    f: (...args: A) => Promise<R>,
    ctx: any,
    scrambleKey: string
  ) => (...args: A) => Promise<R>;
}
