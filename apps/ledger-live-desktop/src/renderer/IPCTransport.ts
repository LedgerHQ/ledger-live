import { ipcRenderer } from "electron";
import Transport from "@ledgerhq/hw-transport";
import { TraceContext, trace } from "@ledgerhq/logs";
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

const LOG_TYPE = "ipc-transport";

/**
 * Transport implementation communicating via IPC to an actual Transport implementation in the internal process.
 */
export class IPCTransport extends Transport {
  static isSupported = (): Promise<boolean> => Promise.resolve(typeof ipcRenderer === "function");
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

  /**
   * Sends an `open` IPC message to open a transport on the internal process
   *
   * @param id id representing the device and how it is connected
   * @param timeoutMs optional timeout that limits in time the open attempt of the matching registered transport.
   * @param context optional context to be used in logs
   * @returns an instance of the IPCTransport once a transport on the internal process has been successfully opened.
   *  Rejects with an Error if no transport implementation on the internal process can open the device
   */
  static async open(id: string, timeoutMs?: number, context?: TraceContext): Promise<Transport> {
    try {
      await rendererRequest(transportOpenChannel, {
        descriptor: id,
        timeoutMs,
        context,
      });
    } catch (error) {
      trace({
        type: LOG_TYPE,
        message: "Error while trying to open a transport",
        data: { error },
        context,
      });

      throw error;
    }
    return new IPCTransport(id, { context });
  }

  id: string;
  constructor(id: string, { context }: { context?: TraceContext } = {}) {
    super({ context, logType: LOG_TYPE });
    this.id = id;

    this.tracer.trace(`New instance of IPCTransport for id: ${this.id}`);
  }

  /**
   * Sends an `exchange` IPC message to a transport on the internal process and waits for a response
   *
   * @param apdu
   * @param options Contains optional options for the exchange function
   *  - abortTimeoutMs: stop the exchange after a given timeout. Another timeout exists
   *    to detect unresponsive device (see `unresponsiveTimeout`). This timeout aborts the exchange.
   * @returns A promise that resolves with the response data from the device.
   */
  async exchange(
    apdu: Buffer,
    { abortTimeoutMs }: { abortTimeoutMs?: number } = {},
  ): Promise<Buffer> {
    const apduHex = apdu.toString("hex");
    this.tracer.withType("ipc-apdu").trace(`=> ${apduHex}`);

    const responseHex = await rendererRequest(transportExchangeChannel, {
      descriptor: this.id,
      apduHex,
      abortTimeoutMs,
    });

    this.tracer.withType("ipc-apdu").trace(`<= ${responseHex}`);
    return Buffer.from(responseHex as string, "hex");
  }

  exchangeBulk(apdus: Buffer[], observer: Observer<Buffer>) {
    const apdusHex = apdus.map(apdu => apdu.toString("hex"));
    this.tracer.trace("Bulk exchange", { apdusLength: apdusHex.length });

    const requestId = uuidv4();
    const replyChannel = `${transportExchangeBulkChannel}_RESPONSE_${requestId}`;

    const handler = (
      _event: Electron.IpcRendererEvent,
      message: { error?: unknown; data: unknown },
    ) => {
      if (message.error) {
        this.tracer.trace(`Error on bulk exchange: ${message.error}`, { error: message.error });
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

  async close(): Promise<void> {
    return rendererRequest(transportCloseChannel, {
      descriptor: this.id,
    }).then(response => {
      this.tracer.trace("Received response from close request message", { response });
      /* close() must return a Promise<void> */
    });
  }
}

/**
 * Sends a request from the renderer process to the main process.
 *
 * It waits for a response before resolving.
 * This is a classic request/response communication: one request then one response.
 *
 * @param channel name of the IPC channel to communicate with the main process
 * @param data
 * @returns a Promise that will resolve when a response (error or message) is received
 */
function rendererRequest(channel: string, data: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const requestId = uuidv4();
    // This channel name will be constructed the same way on the main process to send back a response
    const replyChannel = `${channel}_RESPONSE_${requestId}`;

    trace({
      type: LOG_TYPE,
      message: "Sending request",
      data: { data },
      context: { requestId, replyChannel },
    });

    const responseHandler = (
      _event: Electron.IpcRendererEvent,
      message: { error?: unknown; data: unknown },
    ) => {
      if (message.error) {
        reject(deserializeError(message.error));
      } else {
        resolve(message.data);
      }
      ipcRenderer.removeListener(replyChannel, responseHandler);
    };

    // Listens to response
    ipcRenderer.on(replyChannel, responseHandler);

    ipcRenderer.send(channel, {
      data,
      requestId,
    });
  });
}
