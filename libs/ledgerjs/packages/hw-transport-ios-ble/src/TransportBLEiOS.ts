import Transport from "@ledgerhq/hw-transport";

/**
 * iOS Bluetooth Transport implementation
 */
export default class TransportBLEiOS extends Transport {
  /**
   * SwiftTransport lives in the `global` scope and gets injected by the Swift Native Module
   */
  private transport: SwiftTransportType;

  constructor() {
    super();
    this.transport = SwiftTransport.create();
  }

  /**
   * communicate with a BLE transport
   */
  async exchange(apdu: Buffer): Promise<Buffer> {
    try {
      const response = await this.promisify(this.transport.exchange(apdu));
      return Buffer.from(response);
    } catch (error) {
      throw error
    }
  }

  promisify(callback: Callback): Promise<any> {
    return new Promise((resolve, reject) => {
      callback(function (response, error) {
        if (error == "") {
          resolve(response);
        } else {
          reject(error)
        }
      });
    });
  }

  arrayToBuffer(int8Array: Uint8Array): Buffer {
    return Buffer.from(int8Array);
  }
}

type Callback = (f: (response: unknown, error: unknown) => void) => void;

type SwiftTransportType = {
  exchange: (_: Buffer) => Callback;
  create: () => SwiftTransportType;
};

declare global {
  const SwiftTransport: SwiftTransportType
}
