// Copied from https://github.com/LedgerHQ/eth-dapp-browser/blob/main/src/DAPPBrowserV2/SmartWebsocket.ts
import EventEmitter from "events";

const DEFAULT_RECONNECT = false;
const DEFAULT_RECONNECT_DELAY = 5000;
const DEFAULT_RECONNECT_MAX_ATTEMPTS = 3;

function logger(message: string, ...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log(`%c[WEBSOCKET] ${message}`, "background: #eee; color: #F70", ...args);
}

type SmartWebsocketOptions = {
  reconnect?: boolean;
  reconnectMaxAttempts?: number;
  reconnectDelay?: number;
  logger?: (message: string, ...args: unknown[]) => void;
};

export class SmartWebsocket extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private _connected: false | Promise<WebSocket> = false;
  private reconnect: boolean;
  private reconnectMaxAttempts: number;
  private reconnectDelay: number;
  public logger: (message: string, ...args: unknown[]) => void;

  constructor(url: string, options?: SmartWebsocketOptions) {
    super();
    this.url = url;

    this.logger = options?.logger || logger;
    this.reconnect = options?.reconnect || DEFAULT_RECONNECT;
    this.reconnectMaxAttempts = options?.reconnectMaxAttempts || DEFAULT_RECONNECT_MAX_ATTEMPTS;
    this.reconnectDelay = options?.reconnectDelay || DEFAULT_RECONNECT_DELAY;
  }

  async connect(): Promise<WebSocket> {
    if (this._connected) {
      return this._connected;
    }

    if (this.reconnectAttempts) {
      this.emit("reconnecting");
      this.logger(`reconnecting (${this.reconnectAttempts}/${this.reconnectMaxAttempts})`);
    } else {
      this.emit("connecting");
      this.logger(`connecting to ${this.url}`);
    }

    this._connected = new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(this.url);

        ws.onopen = () => {
          this.emit("connected");
          this.logger("connected");
          resolve(ws);
          this.reconnectAttempts = 0;
        };

        ws.onmessage = (event: MessageEvent) => {
          const message = JSON.parse(event.data);
          this.emit("message", message);
          this.logger("message", message);
        };

        ws.onclose = event => {
          this.ws = null;
          this._connected = false;
          this.logger("disconnected", event);
          this.emit("disconnected");

          if (this.reconnect && !event.wasClean) {
            if (this.reconnectAttempts < this.reconnectMaxAttempts) {
              this.reconnectAttempts++;
              this.logger("will reconnect in 5s");
              setTimeout(() => {
                this.connect().then(resolve).catch(reject);
              }, this.reconnectDelay);
            } else {
              reject(new Error(`Max reconnect attempts reached (${this.reconnectMaxAttempts})`));
              this.logger(`Max reconnect attempts reached (${this.reconnectMaxAttempts})`);
              this.reconnectAttempts = 0;
            }
          } else {
            reject();
          }
        };

        this.ws = ws;
      } catch (error) {
        reject(error);
      }
    });

    return this._connected;
  }

  async connected() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return this.ws;
    } else if (this._connected) {
      return this._connected;
    }

    return this.connect();
  }

  async send(message: unknown) {
    const ws = await this.connected();
    ws.send(JSON.stringify(message));
    this.logger("sent", message);
  }

  close() {
    if (this.ws) {
      this.logger("closing");
      this.ws.close(1000, "terminated");
    }
    this._connected = false;
  }
}
