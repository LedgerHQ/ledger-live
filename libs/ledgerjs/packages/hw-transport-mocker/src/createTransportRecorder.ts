import Transport from "@ledgerhq/hw-transport";
import type { RecordStore } from "./RecordStore";

/**
 * decorate a real transport and proxy it to record the APDUs.
 * @param {Transport} DecoratedTransport: an actual transport class. Like @ledgerhq/hw-transport-webusb
 * @param {RecordStore} recordStore: a record store to record the apdu in.
 */
const createTransportRecorder = (
  DecoratedTransport: Transport,
  recordStore: RecordStore,
): new (T) => Transport => {
  class TransportRecorder extends Transport {
    static recordStore = recordStore;
    static isSupported = (DecoratedTransport.constructor as typeof Transport).isSupported;
    static list = (DecoratedTransport.constructor as typeof Transport).list;
    static listen = (DecoratedTransport.constructor as typeof Transport).listen;
    static open = (descriptor: any, ...args) =>
      (DecoratedTransport.constructor as typeof Transport)
        .open(descriptor, ...args)
        .then(t => new TransportRecorder(t));

    setScrambleKey() {}

    close() {
      return this.transport.close();
    }

    transport: Transport;

    constructor(t: Transport) {
      super();
      this.transport = t;
    }

    exchange(apdu: Buffer): Promise<Buffer> {
      const output = this.transport.exchange(apdu);
      output.then(out => {
        recordStore.recordExchange(apdu, out);
      });
      return output;
    }
  }

  return TransportRecorder;
};

export default createTransportRecorder;
