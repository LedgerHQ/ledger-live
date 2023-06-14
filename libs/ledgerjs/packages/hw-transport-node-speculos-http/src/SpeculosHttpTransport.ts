import axios from "axios";
import { AxiosInstance } from "axios";
import { DisconnectedDevice } from "@ledgerhq/errors";
import Transport from "@ledgerhq/hw-transport";
import { log } from "@ledgerhq/logs";
import { Subject } from "rxjs";

export type SpeculosHttpTransportOpts = {
  apiPort?: string;
  timeout?: number;
  baseURL?: string;
};

enum SpeculosButton {
  LEFT = "Ll",
  RIGHT = "Rr",
  BOTH = "LRlr",
}

/**
 * Speculos TCP transport implementation
 *
 * @example
 * import SpeculosHttpTransport from "@ledgerhq/hw-transport-node-speculos-http";
 * const transport = await SpeculosHttpTransport.open();
 * const res = await transport.send(0xE0, 0x01, 0, 0);
 */
export default class SpeculosHttpTransport extends Transport {
  instance: AxiosInstance;
  opts: SpeculosHttpTransportOpts;
  eventStream: any; // ReadStream?
  automationEvents: Subject<Record<string, any>> = new Subject();

  constructor(instance: AxiosInstance, opts: SpeculosHttpTransportOpts) {
    super();
    this.instance = instance;
    this.opts = opts;
  }

  static isSupported = (): Promise<boolean> => Promise.resolve(true);
  // this transport is not discoverable
  static list = (): any => Promise.resolve([]);
  static listen = (_observer: any) => ({
    unsubscribe: () => {},
  });

  buttonTable = {
    [SpeculosButton.BOTH]: "both",
    [SpeculosButton.RIGHT]: "right",
    [SpeculosButton.LEFT]: "left",
  };

  static open = (opts: SpeculosHttpTransportOpts): Promise<SpeculosHttpTransport> =>
    new Promise((resolve, reject) => {
      const instance = axios.create({
        baseURL: `http://localhost:${opts.apiPort || "5000"}`,
        timeout: opts.timeout,
      });

      const transport = new SpeculosHttpTransport(instance, opts);

      instance({
        url: "/events?stream=true",
        responseType: "stream",
      })
        .then(response => {
          response.data.on("data", chunk => {
            log("speculos-event", chunk.toString());
            const split = chunk.toString().replace("data: ", "");
            const json = JSON.parse(split);
            transport.automationEvents.next(json);
          });
          response.data.on("close", () => {
            log("speculos-event", "close");
            transport.emit("disconnect", new DisconnectedDevice("Speculos exited!"));
          });
          transport.eventStream = response.data;
          // we are connected to speculos
          resolve(transport);
        })
        .catch(error => {
          reject(error);
        });
    });

  /**
   * Press and release button
   * buttons available: left, right, both
   * @param {*} but
   */
  button = (but: string): Promise<void> =>
    new Promise((resolve, reject) => {
      const input = this.buttonTable[but] ?? but;
      log("speculos-button", "press-and-release", input);
      this.instance
        .post(`/button/${input}`, { action: "press-and-release" })
        .then(response => {
          resolve(response.data);
        })
        .catch(e => {
          reject(e);
        });
    });

  async exchange(apdu: Buffer): Promise<any> {
    const hex = apdu.toString("hex");
    log("apdu", "=> " + hex);
    return this.instance.post("/apdu", { data: hex }).then(r => {
      // r.data is {"data": "hex value of response"}
      const data = r.data.data;
      log("apdu", "<= " + data);
      return Buffer.from(data, "hex");
    });
  }

  async close() {
    // close event stream
    this.eventStream.destroy();
    return Promise.resolve();
  }
}
