import Transport from "@ledgerhq/hw-transport";
import { DisconnectedDevice } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { Subject, firstValueFrom } from "rxjs";
import { filter, timeout as rxTimeout } from "rxjs/operators";
import {
  DeviceManagementKitBuilder,
  DeviceManagementKit,
  ConsoleLogger,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import {
  speculosTransportFactory,
  HttpSpeculosDatasource,
} from "@ledgerhq/device-transport-kit-speculos";
import { getEnv } from "@ledgerhq/live-env";
import { deviceControllerFactory } from "@ledgerhq/speculos-device-controller";

export type SpeculosHttpTransportOpts = {
  apiPort?: string;
  timeout?: number;
  baseURL?: string;
};

export enum SpeculosButton {
  LEFT = "Ll",
  RIGHT = "Rr",
  BOTH = "LRlr",
}

function resolveBaseFromEnv(opts: SpeculosHttpTransportOpts): string {
  const rawHost =
    opts.baseURL ??
    (typeof process !== "undefined" ? process.env?.SPECULOS_ADDRESS : undefined) ??
    (typeof process !== "undefined" ? process.env?.LLD_SPECULOS_BASE_URL : undefined) ??
    (typeof process !== "undefined" ? process.env?.SPECULOS_BASE_URL : undefined) ??
    "http://127.0.0.1";

  const host = rawHost.replace(/\/+$/, "");

  if (/:\\d+$/.test(host) || /:\d+$/.test(host)) {
    const base = host;
    log("speculos-transport", `using explicit base=${base}`);
    return base;
  }

  const safeGetEnv = (k: string): string | undefined => {
    try {
      const v = getEnv(k as any);
      return v != null && String(v).trim() !== "" ? String(v) : undefined;
    } catch {
      return undefined;
    }
  };

  const port =
    opts.apiPort ??
    safeGetEnv("SPECULOS_API_PORT") ??
    (typeof process !== "undefined" ? process.env?.SPECULOS_API_PORT : undefined) ??
    (typeof process !== "undefined" ? process.env?.LLD_SPECULOS_HTTP_PORT : undefined) ??
    (typeof process !== "undefined" ? process.env?.SPECULOS_HTTP_PORT : undefined) ??
    "5000";

  const base = `${host}:${port}`;
  log("speculos-transport", `using base=${base}`);
  return base;
}

type DmkEntry = {
  dmk: DeviceManagementKit;
  sessionId?: string;
  connectPromise?: Promise<void>;
  sendChain: Promise<void>;
  timeout: number;
};

type AnyReadableStream = ReadableStream<Uint8Array> | NodeJS.ReadableStream;

export default class SpeculosHttpTransport extends Transport {
  private static byBase = new Map<string, DmkEntry>();

  private static ensureEntry(base: string, timeout: number): DmkEntry {
    let entry = this.byBase.get(base);
    if (!entry) {
      const dmk = new DeviceManagementKitBuilder()
        .addTransport(speculosTransportFactory(base, true))
        .addLogger(new ConsoleLogger())
        .build();
      entry = { dmk, sendChain: Promise.resolve(), timeout };
      this.byBase.set(base, entry);
    } else {
      entry.timeout = timeout;
    }
    return entry;
  }

  private static async ensureSession(entry: DmkEntry) {
    if (entry.sessionId) return;
    if (entry.connectPromise) return entry.connectPromise;

    entry.connectPromise = (async () => {
      const devices = await firstValueFrom<DiscoveredDevice[]>(
        entry.dmk.listenToAvailableDevices({}).pipe(
          filter(list => list.length > 0),
          rxTimeout(entry.timeout),
        ),
      );
      entry.sessionId = await entry.dmk.connect({
        device: devices[0],
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
    })();

    try {
      await entry.connectPromise;
    } finally {
      entry.connectPromise = undefined;
    }
  }

  private readonly opts: SpeculosHttpTransportOpts;
  private readonly base: string;
  private readonly ds: HttpSpeculosDatasource;

  private sseStream: AnyReadableStream | null = null;
  automationEvents: Subject<Record<string, unknown>> = new Subject();

  private constructor(opts: SpeculosHttpTransportOpts) {
    super();
    this.opts = opts;
    this.base = resolveBaseFromEnv(opts);
    this.ds = new HttpSpeculosDatasource(this.base, true, "ldmk-transport-speculos");
  }

  static isSupported = async () => true;
  static list = async () => [];
  static listen = (_observer: any) => ({ unsubscribe: () => {} });

  private readonly buttonTable = {
    [SpeculosButton.BOTH]: "both",
    [SpeculosButton.RIGHT]: "right",
    [SpeculosButton.LEFT]: "left",
  } as const;

  static open = async (opts: SpeculosHttpTransportOpts = {}): Promise<SpeculosHttpTransport> => {
    const t = new SpeculosHttpTransport(opts);
    const base = t.base;
    const connectTimeout = opts.timeout ?? 10_000;

    this.ensureEntry(base, connectTimeout);

    // Guard process access for browser builds
    const sseEnvEnabled =
      typeof process !== "undefined" && process.env?.SPECULOS_TRANSPORT_SSE === "true";

    if (sseEnvEnabled) {
      t.sseStream = await t.ds.openEventStream(
        evt => {
          log("speculos-event", JSON.stringify(evt));
          t.automationEvents.next(evt);
        },
        () => {
          log("speculos-event", "close");
          t.emit("disconnect", new DisconnectedDevice("Speculos exited!"));
        },
      );
    }

    return t;
  };

  button = (but: string): Promise<void> => {
    const deviceController = deviceControllerFactory(this.base);
    const input =
      (this.buttonTable as any)[but] ??
      (but === "Ll" ? "left" : but === "Rr" ? "right" : but === "LRlr" ? "both" : but);
    log("speculos-button", "press-and-release", input);
    return deviceController.button.press(input);
  };

  async exchange(apdu: Buffer): Promise<Buffer> {
    const entry = SpeculosHttpTransport.ensureEntry(this.base, this.opts.timeout ?? 10_000);

    const run = async (): Promise<Buffer> => {
      await SpeculosHttpTransport.ensureSession(entry);
      const hex = apdu.toString("hex");
      log("apdu", "=> " + hex);

      try {
        const { data, statusCode } = await entry.dmk.sendApdu({
          sessionId: entry.sessionId!,
          apdu: new Uint8Array(apdu.buffer, apdu.byteOffset, apdu.byteLength),
        });
        const resp = Buffer.from([...data, ...statusCode]);
        log("apdu", "<= " + resp.toString("hex"));
        return resp;
      } catch {
        entry.sessionId = undefined;
        await SpeculosHttpTransport.ensureSession(entry);
        const { data, statusCode } = await entry.dmk.sendApdu({
          sessionId: entry.sessionId!,
          apdu: new Uint8Array(apdu.buffer, apdu.byteOffset, apdu.byteLength),
        });
        const resp = Buffer.from([...data, ...statusCode]);
        log("apdu", "<= " + resp.toString("hex"));
        return resp;
      }
    };

    const p = entry.sendChain.then(run, run);
    entry.sendChain = p.then(
      () => {},
      () => {},
    );
    return p;
  }

  async close() {
    try {
      const s = this.sseStream;
      if (!s) return;

      // Prefer WHATWG stream cancel (browser/Node fetch)
      if ("cancel" in s && typeof (s as ReadableStream<Uint8Array>).cancel === "function") {
        await (s as ReadableStream<Uint8Array>).cancel();
      } else {
        // Fallback to Node stream destroy
        const nodeStream = s as NodeJS.ReadableStream;
        if ("destroy" in nodeStream && typeof nodeStream.destroy === "function") {
          nodeStream.destroy();
        }
      }
    } catch {
      // ignore
    } finally {
      this.sseStream = null;
    }
  }
}
