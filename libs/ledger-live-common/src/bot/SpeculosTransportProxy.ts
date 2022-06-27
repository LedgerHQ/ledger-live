import Transport from "@ledgerhq/hw-transport";
import { TransportError } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { Subject } from "rxjs";
import { getEnv } from "../env";

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

export default class SpeculosTransportProxy extends Transport {
  static isSupported = (): Promise<boolean> =>
    Promise.resolve(typeof WebSocket === "function");
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
              "WebSocketTransportNotAccessible"
            )
          );
        }
      };

      socket.onerror = () => {
        reject(
          new TransportError(
            "failed to access WebSocketTransport(" + url + "): error",
            "WebSocketTransportNotAccessible"
          )
        );
      };
    });

  static async open(url: string) {
    const automationEvents: Subject<Record<string, any>> = new Subject();
    const exchangeMethods = await new Promise((resolve, reject) => {
      try {
        const socket = new WebSocket(url);
        const exchangeMethods = {
          resolveExchange: (_b: Buffer) => {},
          rejectExchange: (_e: any) => {},
          onDisconnect: () => {},
          close: () => socket.close(),
          send: (msg) => socket.send(msg),
        };

        socket.onopen = () => {
          socket.send(
            JSON.stringify({
              type: "open"
            })
          );
        };

        socket.onerror = (e) => {
          exchangeMethods.onDisconnect();
          reject(e);
        };

        socket.onclose = () => {
          exchangeMethods.close();
          reject(new TransportError("OpenFailed", "OpenFailed"));
        };

        socket.onmessage = (e) => {
          if (typeof e.data !== "string") return;
          const data = JSON.parse(e.data);

          switch (data.type) {
            case "opened":
              return resolve(exchangeMethods);

            case "error":
              reject(new Error(data.error));
              return exchangeMethods.rejectExchange(
                new TransportError(data.error, "WSError")
              );

            case "response":
              return exchangeMethods.resolveExchange(
                Buffer.from(data.data, "hex")
              );

            case "screen":
              automationEvents.next(data.data);
              break;

            case "close":
              exchangeMethods.close();
              break;
          }
        };
      } catch (e) {
        reject(e);
      }
    });
    return new SpeculosTransportProxy(exchangeMethods, automationEvents);
  }

  hook: any;
  automationEvents: Subject<Record<string, any>> | undefined;

  constructor(hook: any, automationEvents: Subject<Record<string, any>>) {
    super();
    this.hook = hook;
    this.automationEvents = automationEvents;

    hook.onDisconnect = () => {
      this.emit("disconnect");
      this.hook.rejectExchange(
        new TransportError("WebSocket disconnected", "WSDisconnect")
      );
    };
  }

  async exchange(apdu: Buffer): Promise<Buffer> {
    const hex = apdu.toString("hex");

    log("apdu", "=> " + hex);
    const res: Buffer = await new Promise((resolve, reject) => {
      this.hook.rejectExchange = reject;

      this.hook.resolveExchange = resolve;

      this.hook.send(JSON.stringify({ type: "exchange", data: hex }));
    });
    log("apdu", "<= " + res.toString("hex"));
    return res;
  }

  setScrambleKey() {}

  button = (command: string): Promise<void> =>
    new Promise(() => {
      this.hook.send(JSON.stringify({ type: "button", data: command }));
    });

  async close() {
    this.hook.close();
    return Promise.resolve();
  }
}
