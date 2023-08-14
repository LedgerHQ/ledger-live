import Transport from "@ledgerhq/hw-transport";
import { TransportError } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      WebSocket?: WebSocket;
    }
  }
}

const WebSocket = global.WebSocket || require("ws");
/**
 * WebSocket transport implementation
 */

export default class WebSocketTransport extends Transport {
  static isSupported = (): Promise<boolean> => Promise.resolve(typeof WebSocket === "function");
  // this transport is not discoverable
  static list = (): any => Promise.resolve([]);
  static listen = (_observer: any) => ({
    unsubscribe: () => {},
  });
  static check = async (url: string, timeout = 5000) =>
    new Promise((resolve, reject) => {
      const socket = new WebSocket(url);
      let success = false;
      setTimeout(() => {
        socket.close();
      }, timeout);

      socket.onopen = () => {
        success = true;
        socket.close();
      };

      socket.onclose = () => {
        if (success) resolve(undefined);
        else {
          reject(
            new TransportError(
              "failed to access WebSocketTransport(" + url + ")",
              "WebSocketTransportNotAccessible",
            ),
          );
        }
      };

      socket.onerror = () => {
        reject(
          new TransportError(
            "failed to access WebSocketTransport(" + url + "): error",
            "WebSocketTransportNotAccessible",
          ),
        );
      };
    });

  static async open(url: string) {
    const exchangeMethods = await new Promise((resolve, reject) => {
      try {
        const socket = new WebSocket(url);
        const exchangeMethods = {
          resolveExchange: (_b: Buffer) => {},
          rejectExchange: (_e: any) => {},
          onDisconnect: () => {},
          close: () => socket.close(),
          send: msg => socket.send(msg),
        };

        socket.onopen = () => {
          socket.send("open");
        };

        socket.onerror = e => {
          exchangeMethods.onDisconnect();
          reject(e);
        };

        socket.onclose = () => {
          exchangeMethods.onDisconnect();
          reject(new TransportError("OpenFailed", "OpenFailed"));
        };

        socket.onmessage = e => {
          if (typeof e.data !== "string") return;
          const data = JSON.parse(e.data);

          switch (data.type) {
            case "opened":
              return resolve(exchangeMethods);

            case "error":
              reject(new Error(data.error));
              return exchangeMethods.rejectExchange(new TransportError(data.error, "WSError"));

            case "response":
              return exchangeMethods.resolveExchange(Buffer.from(data.data, "hex"));
          }
        };
      } catch (e) {
        reject(e);
      }
    });
    return new WebSocketTransport(exchangeMethods);
  }

  hook: any;

  constructor(hook: any) {
    super();
    this.hook = hook;

    hook.onDisconnect = () => {
      this.emit("disconnect");
      this.hook.rejectExchange(new TransportError("WebSocket disconnected", "WSDisconnect"));
    };
  }

  async exchange(apdu: Buffer): Promise<Buffer> {
    const hex = apdu.toString("hex");
    log("apdu", "=> " + hex);
    const res: Buffer = await new Promise((resolve, reject) => {
      this.hook.rejectExchange = (e: any) => reject(e);

      this.hook.resolveExchange = (b: Buffer) => resolve(b);

      this.hook.send(hex);
    });
    log("apdu", "<= " + res.toString("hex"));
    return res;
  }

  setScrambleKey() {}

  async close() {
    this.hook.close();
    return new Promise<void>(success => {
      setTimeout(() => {
        success(undefined);
      }, 200);
    });
  }
}
