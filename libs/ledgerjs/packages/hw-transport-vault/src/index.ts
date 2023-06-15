import { log } from "@ledgerhq/logs";
import { TransportError } from "@ledgerhq/errors";
import WebSocketTransport from "@ledgerhq/hw-transport-http/lib-es/WebSocketTransport";

type VaultData = {
  token: string;
  workspace: string;
};

let sessionId: string | null = null;

export default class VaultTransport extends WebSocketTransport {
  protected data: VaultData | null;

  constructor(hook: any) {
    super(hook);
    this.data = null;
  }

  setData(data: VaultData): void {
    this.data = data;
  }

  static async open(url: string) {
    const exchangeMethods = await new Promise((resolve, reject) => {
      try {
        const socket = new WebSocket(url);
        const exchangeMethods = {
          resolveExchange: (_b: Buffer, _sessionId?: string | null) => {},
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
              return exchangeMethods.resolveExchange(Buffer.from(data.data, "hex"), data.sessionId);
          }
        };
      } catch (e) {
        reject(e);
      }
    });
    return new VaultTransport(exchangeMethods);
  }

  async exchange(apdu: Buffer): Promise<Buffer> {
    const hex = apdu.toString("hex");
    log("apdu", "=> " + hex);

    const iv = setInterval(() => {
      this.hook.send("ping");
    }, 30e3);

    try {
      const res: Buffer = await new Promise((resolve, reject) => {
        this.hook.rejectExchange = (e: any) => reject(e);

        this.hook.resolveExchange = (b: Buffer, _sessionId?: string | null) => {
          if (_sessionId) {
            sessionId = _sessionId;
          }
          return resolve(b);
        };
        const data = {
          sessionId,
          workspace: this.data?.workspace,
          token: this.data?.token,
          apdu: hex,
        };
        this.hook.send(JSON.stringify(data));
      });
      log("apdu", "<= " + res.toString("hex"));
      return res;
    } finally {
      clearInterval(iv);
    }
  }
}
