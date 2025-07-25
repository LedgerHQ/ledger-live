import Transport, {
  type Observer,
  type Subscription as HwSubscription,
} from "@ledgerhq/hw-transport";
import {
  DeviceManagementKitBuilder,
  DeviceManagementKit,
  DeviceStatus,
  ConsoleLogger,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { LocalTracer } from "@ledgerhq/logs";
import { firstValueFrom } from "rxjs";
import { filter, timeout } from "rxjs/operators";
import { WsProxyTransportFactory } from "@ledgerhq/device-transport-kit-proxy";

export type ProxyOpts = {
  url: string;
  timeout?: number;
};

type UrlInput = string | string[] | (() => Promise<string[]>);

/**
 * Base class to wire up
 */
export class BaseProxyTransport extends Transport {
  public tracer = new LocalTracer("ProxyTransport");
  constructor(
    protected readonly dmk: DeviceManagementKit,
    protected readonly sessionId: string,
  ) {
    super();
    // forward DMK session state NOT_CONNECTED to disconnect event
    this.dmk.getDeviceSessionState({ sessionId }).subscribe(({ deviceStatus }) => {
      if (deviceStatus === DeviceStatus.NOT_CONNECTED) {
        this.emit("disconnect");
      }
    });
  }
  setScrambleKey(): void {
    // no-op
  }
}

/**
 * HTTP transport for Device Management Kit Proxy
 **/
export class HttpProxyTransport extends BaseProxyTransport {
  static isSupported(): Promise<boolean> {
    return Promise.resolve(true);
  }
  static async list(): Promise<string[]> {
    return [];
  }
  static listen(_obs: Observer<{ type: "add"; descriptor: string }>): HwSubscription {
    return { unsubscribe: () => {} };
  }
  static async open(opts: ProxyOpts): Promise<Transport> {
    const { url, timeout: to = 5000 } = opts;

    const dmk = new DeviceManagementKitBuilder()
      .addTransport(WsProxyTransportFactory(url))
      .addLogger(new ConsoleLogger())
      .build();

    const devices = await firstValueFrom<DiscoveredDevice[]>(
      dmk.listenToAvailableDevices({}).pipe(
        filter(list => list.length > 0),
        timeout(to),
      ),
    );

    const [device] = devices;
    const sessionId = await dmk.connect({
      device,
      sessionRefresherOptions: { isRefresherDisabled: true },
    });
    return new HttpProxyTransport(dmk, sessionId);
  }

  async exchange(apdu: Buffer): Promise<Buffer> {
    const hex = apdu.toString("hex");
    this.tracer.trace(`=> ${hex}`);
    try {
      const { data, statusCode } = await this.dmk.sendApdu({
        sessionId: this.sessionId,
        apdu: Uint8Array.from(apdu),
      });
      const resp = Buffer.from([...data, ...statusCode]);
      this.tracer.trace(`<= ${resp.toString("hex")}`);
      return resp;
    } catch (error) {
      this.emit("disconnect");
      throw error;
    }
  }
  async close(): Promise<void> {
    await this.dmk.disconnect({ sessionId: this.sessionId });
  }
  disconnect(_id?: string) {
    try {
      this.dmk.disconnect({ sessionId: this.sessionId });
    } catch (error) {
      this.tracer.trace("[DMKTransport] [disconnect] error", { error });
    }
  }
}

/**
 * WebSocket transport for Device Management Kit Proxy
 */
export class WsProxyTransport extends BaseProxyTransport {
  static isSupported(): Promise<boolean> {
    return Promise.resolve(true);
  }
  static async list(): Promise<string[]> {
    return [];
  }
  static listen(_obs: Observer<{ type: "add"; descriptor: string }>): HwSubscription {
    return { unsubscribe: () => {} };
  }
  static async open(opts: ProxyOpts): Promise<Transport> {
    const { url, timeout: to = 5000 } = opts;

    const dmk = new DeviceManagementKitBuilder()
      .addTransport(WsProxyTransportFactory(url))
      .addLogger(new ConsoleLogger())
      .build();

    const devices = await firstValueFrom<DiscoveredDevice[]>(
      dmk.listenToAvailableDevices({}).pipe(
        filter(list => list.length > 0),
        timeout(to),
      ),
    );
    const [device] = devices;
    const sessionId = await dmk.connect({
      device,
      sessionRefresherOptions: { isRefresherDisabled: true },
    });
    return new WsProxyTransport(dmk, sessionId);
  }

  async exchange(apdu: Buffer): Promise<Buffer> {
    const hex = apdu.toString("hex");
    this.tracer.trace(`=> ${hex}`);
    try {
      const { data, statusCode } = await this.dmk.sendApdu({
        sessionId: this.sessionId,
        apdu: Uint8Array.from(apdu),
      });
      const resp = Buffer.from([...data, ...statusCode]);
      this.tracer.trace(`<= ${resp.toString("hex")}`);
      return resp;
    } catch (error) {
      this.emit("disconnect");
      throw error;
    }
  }
  async close(): Promise<void> {
    await this.dmk.disconnect({ sessionId: this.sessionId });
  }
  disconnect(_id?: string) {
    try {
      this.dmk.disconnect({ sessionId: this.sessionId });
    } catch (error) {
      this.tracer.trace("[DMKTransport] [disconnect] error", { error });
    }
  }
}

/**
 *  inline “check” that pings the given URL:
 * - for ws:// URLs, tries to open a bare WebSocket
 * - for http:// URLs, does a GET fetch
 */
async function checkUrl(url: string, timeout = 5000): Promise<void> {
  if (url.startsWith("ws")) {
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(url);
      const tid = setTimeout(() => {
        ws.close();
        reject(new Error("timeout"));
      }, timeout);
      ws.onopen = () => {
        clearTimeout(tid);
        ws.close();
        resolve();
      };
      ws.onerror = err => {
        clearTimeout(tid);
        reject(err);
      };
    });
  } else {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`status ${res.status}`);
    } finally {
      clearTimeout(tid);
    }
  }
}

export function createStaticProxyTransport(urls: UrlInput): typeof Transport {
  const resolveUrls = async (): Promise<string[]> => {
    const u = typeof urls === "function" ? await urls() : urls;
    return Array.isArray(u) ? u : [u];
  };

  return class StaticProxyTransport extends Transport {
    static isSupported = Transport.isSupported;

    static async list(): Promise<string[]> {
      const all = await resolveUrls();
      const ok = await Promise.all(
        all.map(async url => {
          try {
            await checkUrl(url);
            return url;
          } catch {
            return null;
          }
        }),
      );
      return ok.filter((u): u is string => !!u);
    }

    static listen(observer: Observer<{ type: "add"; descriptor: string }>): HwSubscription {
      let unsubscribed = false;
      const seen: Record<string, boolean> = {};
      const loop = async () => {
        if (unsubscribed) return;
        const list = await StaticProxyTransport.list();
        for (const url of list) {
          if (!seen[url]) {
            seen[url] = true;
            observer.next({ type: "add", descriptor: url });
          }
        }
        await new Promise(r => setTimeout(r, 5000));
        loop();
      };
      loop();
      return { unsubscribe: () => (unsubscribed = true) };
    }

    static async open(descriptor: string, timeout?: number): Promise<Transport> {
      if (descriptor.startsWith("ws")) {
        return WsProxyTransport.open({ url: descriptor, timeout });
      } else {
        return HttpProxyTransport.open({ url: descriptor, timeout });
      }
    }
  };
}
