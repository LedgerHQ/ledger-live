/**
 * IPC Transport for Speculos and HTTP Proxy only
 * WebHID devices use DeviceManagementKit directly in renderer
 */
import { ipcRenderer } from "electron";
import Transport, { TransportError } from "@ledgerhq/hw-transport";
import { log, trace, TraceContext } from "@ledgerhq/logs";
import { DescriptorEvent } from "@ledgerhq/types-devices";
import { Observer } from "rxjs";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { getDeviceModel } from "@ledgerhq/devices";
// No longer need transport channels - using direct invoke

const LOG_TYPE = "hid-ipc";

// No longer need complex message interfaces - using simple invoke/response

/**
 * IPC Transport implementation for communication with internal process
 * Only used for Speculos and HTTP proxy transports
 */
export default class IPCTransport extends Transport {
  static isSupported = (): Promise<boolean> => Promise.resolve(typeof ipcRenderer === "object");

  static list = (): Promise<unknown[]> => Promise.resolve([]);

  static listen = (observer: Observer<DescriptorEvent<string>>) => {
    let unsubscribed = false;
    const requestId = String(Math.random());

    const unsubscribe = () => {
      if (unsubscribed) return;
      unsubscribed = true;
      ipcRenderer.invoke("transport:listen:unsubscribe", { requestId }).catch(() => {
        // Ignore errors on unsubscribe
      });
    };

    // For HTTP transports, we don't have real device discovery
    // Just send a simple available signal
    ipcRenderer
      .invoke("transport:listen", { requestId })
      .then(result => {
        if (unsubscribed) return;
        if (result.type === "listen-error") {
          observer.error(new TransportError(result.error.message, result.error.id));
        } else {
          observer.next({
            type: "add",
            descriptor: "http-proxy",
            device: {},
            deviceModel: getDeviceModel(DeviceModelId.nanoS),
          });
        }
      })
      .catch(error => {
        if (unsubscribed) return;
        const err = error as Error;
        observer.error(new TransportError(err.message, "TransportListenError"));
      });

    return { unsubscribe };
  };

  static async open(
    descriptor: string,
    timeout?: number,
    context?: TraceContext,
  ): Promise<IPCTransport> {
    log(LOG_TYPE, "open", { descriptor, timeout });

    const requestId = String(Math.random());

    try {
      const result = await ipcRenderer.invoke("transport:open", {
        requestId,
        descriptor,
        timeout,
        context,
      });

      if (result.type === "open-error") {
        trace({
          type: LOG_TYPE,
          message: "open error",
          data: { descriptor, error: result.error },
        });
        throw new TransportError(result.error.message, result.error.id);
      }

      trace({ type: LOG_TYPE, message: "open success", data: { descriptor } });
      return new IPCTransport(descriptor, requestId);
    } catch (error) {
      if (error instanceof TransportError) {
        throw error;
      }
      const err = error as Error;
      throw new TransportError(err.message, "TransportOpenError");
    }
  }

  constructor(
    private descriptor: string,
    private requestId: string,
  ) {
    super();
  }

  async exchange(
    apdu: Buffer,
    { abortTimeoutMs }: { abortTimeoutMs?: number } = {},
  ): Promise<Buffer> {
    const apduHex = apdu.toString("hex");

    log(LOG_TYPE, "exchange", { apdu: apduHex, timeout: abortTimeoutMs });

    try {
      const result = await ipcRenderer.invoke("transport:exchange", {
        requestId: this.requestId,
        apdu: apduHex,
        timeout: abortTimeoutMs,
      });

      if (result.type === "exchange-error") {
        trace({
          type: LOG_TYPE,
          message: "exchange error",
          data: { apdu: apduHex, error: result.error },
        });
        throw new TransportError(result.error.message, result.error.id);
      }

      trace({ type: LOG_TYPE, message: "exchange success", data: { apdu: apduHex } });
      return Buffer.from(result.data, "hex");
    } catch (error) {
      if (error instanceof TransportError) {
        throw error;
      }
      const err = error as Error;
      throw new TransportError(err.message, "TransportExchangeError");
    }
  }

  async close(): Promise<void> {
    log(LOG_TYPE, "close", { descriptor: this.descriptor });

    try {
      await ipcRenderer.invoke("transport:close", {
        requestId: this.requestId,
      });

      trace({
        type: LOG_TYPE,
        message: "close success",
        data: { descriptor: this.descriptor },
      });
    } catch (error) {
      const err = error as Error;
      trace({
        type: LOG_TYPE,
        message: "close error",
        data: { descriptor: this.descriptor, error: err.message },
      });
      // Don't throw on close errors - best effort cleanup
    }
  }

  setScrambleKey() {
    // Not needed for IPC transport
  }
}
