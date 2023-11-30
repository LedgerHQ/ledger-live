import { ipcRenderer } from "electron";
import Transport from "@ledgerhq/hw-transport";
import { log, LocalTracer } from "@ledgerhq/logs";
import APDUContext from "@ledgerhq/live-common/hw/APDUContext";

//new LocalTracer(LOG_TYPE, context)
import { deserializeError } from "@ledgerhq/errors";
import { v4 as uuidv4 } from "uuid";
import {
  transportCloseChannel,
  transportListenChannel,
  transportListenUnsubscribeChannel,
  transportExchangeBulkChannel,
  transportExchangeBulkUnsubscribeChannel,
  transportExchangeChannel,
  transportOpenChannel,
} from "~/config/transportChannels";
import { Observer } from "rxjs";
import { DescriptorEvent } from "@ledgerhq/types-devices";

const rendererRequest = (channel: string, data: unknown) => {
  return new Promise((resolve, reject) => {
    const requestId = uuidv4();
    const replyChannel = `${channel}_RESPONSE_${requestId}`;
    const handler = (
      _event: Electron.IpcRendererEvent,
      message: { error?: unknown; data: unknown },
    ) => {
      if (message.error) {
        reject(deserializeError(message.error));
      } else {
        resolve(message.data);
      }
      ipcRenderer.removeListener(replyChannel, handler);
    };
    ipcRenderer.on(replyChannel, handler);
    ipcRenderer.send(channel, {
      data,
      requestId,
    });
  });
};
export class IPCTransport extends Transport {
  static isSupported = (): Promise<boolean> => Promise.resolve(typeof ipcRenderer === "function");

  //public static currentContext = new LocalTracer("ipc-apdu");

  // this transport is not discoverable
  static list = (): Promise<unknown[]> => Promise.resolve([]);
  static listen = (observer: Observer<DescriptorEvent<string>>) => {
    const requestId = uuidv4();
    const replyChannel = `${transportListenChannel}_RESPONSE_${requestId}`;
    const handler = (
      _event: Electron.IpcRendererEvent,
      message: { error?: unknown; data: DescriptorEvent<string> },
    ) => {
      if (message.error) {
        observer.error(deserializeError(message.error));
      } else {
        const { data } = message;
        if (data) {
          observer.next(data);
        } else {
          observer.complete();
        }
      }
    };
    ipcRenderer.on(replyChannel, handler);
    ipcRenderer.send(transportListenChannel, {
      requestId,
    });
    return {
      unsubscribe: () => {
        ipcRenderer.removeListener(replyChannel, handler);
        ipcRenderer.send(transportListenUnsubscribeChannel, {
          requestId,
        });
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
    //log("ipc-apdu", "=> " + apduHex);
    //IPCTransport.currentContext

    APDUContext.currentContext.trace("=> " + apduHex);

    const responseHex = await rendererRequest(transportExchangeChannel, {
      descriptor: this.id,
      apduHex,
    });
    //log("ipc-apdu", "<= " + responseHex);
    APDUContext.currentContext.trace("<= " + responseHex);
    return Buffer.from(responseHex as string, "hex");
  }

  exchangeBulk(apdus: Buffer[], observer: Observer<Buffer>) {
    const apdusHex = apdus.map(apdu => apdu.toString("hex"));
    log("ipc-apdu-info", "bulk of " + apdusHex.length + " apdus");
    const requestId = uuidv4();
    const replyChannel = `${transportExchangeBulkChannel}_RESPONSE_${requestId}`;
    const handler = (
      _event: Electron.IpcRendererEvent,
      message: { error?: unknown; data: unknown },
    ) => {
      if (message.error) {
        observer.error(deserializeError(message.error));
      } else {
        const { data } = message;
        if (data) {
          observer.next(Buffer.from(data as string, "hex"));
        } else {
          observer.complete();
        }
      }
    };
    ipcRenderer.on(replyChannel, handler);
    ipcRenderer.send(transportExchangeBulkChannel, {
      data: {
        descriptor: this.id,
        apdusHex,
      },
      requestId,
    });
    return {
      unsubscribe: () => {
        ipcRenderer.removeListener(replyChannel, handler);
        ipcRenderer.send(transportExchangeBulkUnsubscribeChannel, {
          data: {
            descriptor: this.id,
          },
          requestId,
        });
      },
    };
  }

  setScrambleKey() {
    // empty fn
  }

  close(): Promise<void> {
    return rendererRequest(transportCloseChannel, {
      descriptor: this.id,
    }).then(() => {
      /* close() must return a Promise<void> */
    });
  }
}
