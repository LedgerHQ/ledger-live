import axios from "axios";
import { AxiosInstance } from "axios";
import { DisconnectedDevice } from "@ledgerhq/errors";
import Transport from "@ledgerhq/hw-transport";
import { log } from "@ledgerhq/logs";

export type SpeculosHttpTransportOpts = {
  baseURL?: string;
  timeout?: number;
};

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

  static open = (
    opts: SpeculosHttpTransportOpts
  ): Promise<SpeculosHttpTransport> =>
    new Promise((resolve, reject) => {
      const instance = axios.create(opts);
      instance.defaults.baseURL = "http://localhost:5000";

      const transport = new SpeculosHttpTransport(instance, opts);

      instance({
        url: "/events?stream=true",
        responseType: "stream",
      })
        .then((response) => {
          response.data.on("data", (chunk) => {
            log("speculos-event", chunk.toString());
            // XXX: we could process display events here
            // client side automation or UI tests/checks
          });
          response.data.on("close", () => {
            log("speculos-event", "close");
            transport.emit(
              "disconnect",
              new DisconnectedDevice("Speculos exited!")
            );
          });
          transport.eventStream = response.data;
          // we are connected to speculos
          resolve(transport);
        })
        .catch((error) => {
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
      const action = { action: "press-and-release" };
      log("speculos-button", "press-and-release", but);
      this.instance
        .post(`/button/${but}`, action)
        .then((response) => {
          resolve(response.data);
        })
        .catch((e) => {
          reject(e);
        });
    });

  async exchange(apdu: Buffer): Promise<any> {
    const hex = apdu.toString("hex");
    log("apdu", "=> " + hex);
    return this.instance.post("/apdu", { data: hex }).then((r) => {
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
