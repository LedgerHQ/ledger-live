// @flow

import { ipcRenderer } from "electron";
import Transport from "@ledgerhq/hw-transport";
import { log } from "@ledgerhq/logs";

export class IPCTransport extends Transport {
  static isSupported = (): Promise<boolean> => Promise.resolve(typeof ipcRenderer === "function");
  // this transport is not discoverable
  static list = (): any => Promise.resolve([]);
  static listen = () => {
    return {
      unsubscribe: () => {
        // empty fn
      },
    };
  };

  static async open(id: string): Promise<Transport> {
    await ipcRenderer.invoke("transport:open", {
      descriptor: id,
    });
    return new IPCTransport(id);
  }

  id: string;

  constructor(id: string) {
    super();
    this.id = id;
  }

  async exchange(apdu: Buffer): Promise<Buffer> {
    const apduHex = apdu.toString("hex");
    log("apdu", "=> " + apduHex);

    const responseHex = await ipcRenderer.invoke("transport:exchange", {
      descriptor: this.id,
      apduHex,
    });

    log("apdu", "<= " + responseHex);
    return Buffer.from(responseHex, "hex");
  }

  setScrambleKey() {
    // empty fn
  }

  close(): Promise<void> {
    return ipcRenderer.invoke("transport:close", { descriptor: this.id });
  }
}
