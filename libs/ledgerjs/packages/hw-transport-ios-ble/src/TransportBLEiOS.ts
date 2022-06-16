// @ts-nocheck
import Transport from "@ledgerhq/hw-transport";

export default class TransportBLEiOS extends Transport {
  private transport: SwiftTransport;

  constructor() {
    super();
    this.transport = SwiftTransport.create();
  }

  async exchange(apdu: Buffer): Promise<Buffer> {
    const response = await this.promisify(this.transport.exchange(apdu));
    return Buffer.from(response)
  }

  promisify(callback) {
    return new Promise((resolve, reject) => {
        callback(function(response) {
            resolve(response)
        })
    })
  }
}