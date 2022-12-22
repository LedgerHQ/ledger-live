// @flow

import { ipcRenderer } from "electron";
import Transport from "@ledgerhq/hw-transport";
import { log } from "@ledgerhq/logs";
import { deserializeError } from "@ledgerhq/errors";
import { v4 as uuidv4 } from "uuid";
import {
  transportCloseChannel,
  transportExchangeChannel,
  transportOpenChannel,
} from "~/config/transportChannels";

const rendererRequest = (channel, data) => {
  return new Promise((resolve, reject) => {
    const requestId = uuidv4();
    const replyChannel = `${channel}_RESPONSE_${requestId}`;
    const handler = (event, message) => {
      if (message.error) {
        reject(deserializeError(message.error));
      } else {
        resolve(message.data);
      }
      ipcRenderer.removeListener(replyChannel, handler);
    };

    ipcRenderer.on(replyChannel, handler);
    ipcRenderer.send(channel, { data, requestId });
  });
};

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
    await rendererRequest(transportOpenChannel, {
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

    const responseHex = await rendererRequest(transportExchangeChannel, {
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
    return rendererRequest(transportCloseChannel, { descriptor: this.id });
  }
}
