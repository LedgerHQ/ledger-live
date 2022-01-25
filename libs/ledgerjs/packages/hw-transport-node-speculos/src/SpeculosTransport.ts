import { Subject } from "rxjs";
import net from "net";
import Transport from "@ledgerhq/hw-transport";
import {
  DisconnectedDevice,
  DisconnectedDeviceDuringOperation,
  TransportError,
} from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";

/**
 *
 */
export type SpeculosTransportOpts = {
  apduPort: number;
  buttonPort?: number;
  automationPort?: number;
  host?: string;
};
/**
 * Speculos TCP transport implementation
 *
 * @example
 * import SpeculosTransport from "@ledgerhq/hw-transport-node-speculos";
 * const transport = await SpeculosTransport.open({ apduPort });
 * const res = await transport.send(0xE0, 0x01, 0, 0);
 */

export default class SpeculosTransport extends Transport {
  static isSupported = (): Promise<boolean> => Promise.resolve(true);
  // this transport is not discoverable
  static list = (): any => Promise.resolve([]);
  static listen = (_observer: any) => ({
    unsubscribe: () => {},
  });

  /**
   *
   */
  static open = (opts: SpeculosTransportOpts): Promise<SpeculosTransport> =>
    new Promise((resolve, reject) => {
      const socket = new net.Socket();
      socket.on("error", (e) => {
        socket.destroy();
        reject(e);
      });
      socket.on("end", () => {
        reject(new DisconnectedDevice("tcp closed"));
      });
      socket.connect(opts.apduPort, opts.host || "127.0.0.1", () => {
        // we delay a bit the transport creation to make sure the tcp does not hang up
        setTimeout(() => {
          resolve(new SpeculosTransport(socket, opts));
        }, 100);
      });
    });
  apduSocket: net.Socket;
  opts: SpeculosTransportOpts;
  rejectExchange: (arg0: Error) => void = (_e) => {};
  resolveExchange: (arg0: Buffer) => void = (_b) => {};
  automationSocket: net.Socket | null | undefined;
  automationEvents: Subject<Record<string, any>> = new Subject();

  constructor(apduSocket: net.Socket, opts: SpeculosTransportOpts) {
    super();
    this.opts = opts;
    this.apduSocket = apduSocket;
    apduSocket.on("error", (e) => {
      this.emit("disconnect", new DisconnectedDevice(e.message));
      this.rejectExchange(e);
      this.apduSocket.destroy();
    });
    apduSocket.on("end", () => {
      this.emit("disconnect", new DisconnectedDevice());
      this.rejectExchange(new DisconnectedDeviceDuringOperation());
    });
    apduSocket.on("data", (data) => {
      try {
        this.resolveExchange(decodeAPDUPayload(data));
      } catch (e: any) {
        this.rejectExchange(e);
      }
    });
    const { automationPort } = opts;

    if (automationPort) {
      const socket = new net.Socket();
      this.automationSocket = socket;
      socket.on("error", (e) => {
        log("speculos-automation-error", String(e));
        socket.destroy();
      });
      socket.on("data", (data) => {
        log("speculos-automation-data", data.toString("ascii"));
        const split = data.toString("ascii").split("\n");
        split
          .filter((ascii) => !!ascii)
          .forEach((ascii) => {
            const json = JSON.parse(ascii);
            this.automationEvents.next(json);
          });
      });
      socket.connect(automationPort, opts.host || "127.0.0.1");
    }
  }

  /**
   * Send a speculos button command
   * typically "Ll" would press and release the left button
   * typically "Rr" would press and release the right button
   * @param {*} command
   */
  button = (command: string): Promise<void> =>
    new Promise((resolve, reject) => {
      log("speculos-button", command);
      const { buttonPort, host } = this.opts;
      if (!buttonPort) throw new Error("buttonPort is missing");
      const socket = new net.Socket();
      socket.on("error", (e) => {
        socket.destroy();
        reject(e);
      });
      socket.connect(buttonPort, host || "127.0.0.1", () => {
        socket.write(Buffer.from(command, "ascii"));
        socket.destroy();
        resolve();
      });
    });

  async exchange(apdu: Buffer): Promise<any> {
    const hex = apdu.toString("hex");
    log("apdu", "=> " + hex);
    const encoded = encodeAPDU(apdu);
    const res: Buffer = await new Promise((resolve, reject) => {
      this.rejectExchange = reject;
      this.resolveExchange = resolve;
      this.apduSocket.write(encoded);
    });
    log("apdu", "<= " + res.toString("hex"));
    return res;
  }

  setScrambleKey() {}

  async close() {
    if (this.automationSocket) this.automationSocket.destroy();
    this.apduSocket.destroy();
    return Promise.resolve();
  }
}

function encodeAPDU(apdu: Buffer) {
  const size = Buffer.allocUnsafe(4);
  size.writeUIntBE(apdu.length, 0, 4);
  return Buffer.concat([size, apdu]);
}

function decodeAPDUPayload(data: Buffer) {
  const dataLength = data.readUIntBE(0, 4); // 4 bytes tells the data length

  const size = dataLength + 2; // size does not include the status code so we add 2

  const payload = data.slice(4);

  if (payload.length !== size) {
    throw new TransportError(
      `Expected payload of length ${size} but got ${payload.length}`,
      ""
    );
  }

  return payload;
}
