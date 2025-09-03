import Transport from "@ledgerhq/hw-transport";
import { DisconnectedDevice } from "@ledgerhq/errors";
import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { log, LocalTracer } from "@ledgerhq/logs";
import { Subject, firstValueFrom } from "rxjs";
import { filter, timeout as rxTimeout } from "rxjs/operators";
import {
  DeviceManagementKitBuilder,
  DeviceManagementKit,
  DeviceStatus,
  ConsoleLogger,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { speculosTransportFactory } from "@ledgerhq/device-transport-kit-speculos";
import { preflightApdu, withTimeout } from "../utils/utils";

export type SpeculosHttpTransportOpts = {
  baseURL?: string;
  apiPort?: string;
  timeout?: number;
};

export enum SpeculosButton {
  LEFT = "Ll",
  RIGHT = "Rr",
  BOTH = "LRlr",
}

export default class DeviceManagementKitTransportSpeculos extends Transport {
  private static _instances = new Map<string, DeviceManagementKitTransportSpeculos>();

  private readonly http: AxiosInstance;
  private eventStream: NodeJS.ReadableStream | null = null;
  private readonly dmk: DeviceManagementKit;
  private readonly sessionId: string;

  private static readonly buttonMap = { LEFT: "left", RIGHT: "right", BOTH: "both" } as const;

  public readonly automationEvents = new Subject<Record<string, unknown>>();
  public readonly tracer = new LocalTracer("SpeculosDmkHttpTransport");

  private constructor(http: AxiosInstance, dmk: DeviceManagementKit, sessionId: string) {
    super();
    this.http = http;
    this.dmk = dmk;
    this.sessionId = sessionId;

    this.dmk.getDeviceSessionState({ sessionId }).subscribe(({ deviceStatus }) => {
      if (deviceStatus === DeviceStatus.NOT_CONNECTED) this.emit("disconnect");
    });
  }

  static isSupported(): Promise<boolean> {
    return Promise.resolve(true);
  }
  static list(): Promise<[]> {
    return Promise.resolve([]);
  }
  static listen(_obs: any) {
    return { unsubscribe: () => {} };
  }

  private static readonly buttonAliases: Record<string, "left" | "right" | "both"> = {
    // legacy enum values used across specs
    Ll: "left",
    Rr: "right",
    LRlr: "both",
    // enum keys (if someone passes SpeculosButton.LEFT)
    LEFT: "left",
    RIGHT: "right",
    BOTH: "both",
    // already-normalized strings
    left: "left",
    right: "right",
    both: "both",
  };

  public static async open(
    opts: SpeculosHttpTransportOpts = {},
  ): Promise<DeviceManagementKitTransportSpeculos> {
    const envBase =
      process.env.LLD_SPECULOS_BASE_URL || process.env.SPECULOS_BASE_URL || "http://127.0.0.1";
    const envPort = process.env.LLD_SPECULOS_HTTP_PORT || process.env.SPECULOS_HTTP_PORT;

    const baseURL = opts.baseURL ?? envBase;
    const apiPort = opts.apiPort ?? envPort ?? "5000";
    const connectTimeout = opts.timeout ?? 10000;

    const base = `${baseURL}:${apiPort}`;

    const cached = this._instances.get(base);
    if (cached) return cached;

    const http = axios.create({
      baseURL: base,
      timeout: connectTimeout,
      proxy: false,
      transitional: { clarifyTimeoutError: true },
    });

    await preflightApdu(base, connectTimeout);

    const dmk = new DeviceManagementKitBuilder()
      .addTransport(speculosTransportFactory(base, true))
      .addLogger(new ConsoleLogger())
      .build();

    const devices = await firstValueFrom<DiscoveredDevice[]>(
      dmk.listenToAvailableDevices({}).pipe(
        filter(list => list.length > 0),
        rxTimeout(connectTimeout),
      ),
    );

    const sessionId = await withTimeout(
      dmk.connect({ device: devices[0], sessionRefresherOptions: { isRefresherDisabled: true } }),
      connectTimeout,
      "DMK connect",
    );

    const transport = new DeviceManagementKitTransportSpeculos(http, dmk, sessionId);
    // wait for SSE to be connected before returning
    await transport.openSsePersistent("/events?stream=true", connectTimeout);
    this._instances.set(base, transport);
    return transport;
  }

  private openSsePersistent(path: string, connectTimeoutMs?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const ac = new AbortController();
      let connectTimer: NodeJS.Timeout | null = null;
      let resolved = false;

      if (connectTimeoutMs && connectTimeoutMs > 0) {
        connectTimer = setTimeout(() => {
          ac.abort();
          if (!resolved) reject(new Error("Speculos SSE connect timeout"));
        }, connectTimeoutMs);
      }

      this.http
        .get(path, {
          responseType: "stream",
          timeout: 0, // never time out the live SSE stream
          signal: ac.signal,
          headers: { Accept: "text/event-stream", Connection: "keep-alive" },
          transitional: { clarifyTimeoutError: true },
        })
        .then(res => {
          if (connectTimer) clearTimeout(connectTimer);

          const stream = res.data as NodeJS.ReadableStream;
          this.eventStream = stream;
          resolved = true;
          resolve(); // headers received: stream is established

          let buffer = "";
          stream.on("data", (chunk: Buffer) => {
            buffer += chunk.toString();
            // Process complete lines only; keep partial in buffer
            let idx: number;
            while ((idx = buffer.indexOf("\n")) >= 0) {
              const line = buffer.slice(0, idx);
              buffer = buffer.slice(idx + 1);
              if (line.startsWith("data: ")) {
                const payload = line.slice(6); // after "data: "
                try {
                  this.automationEvents.next(JSON.parse(payload));
                } catch (e) {
                  log("speculos-event", "malformed JSON", { line, error: String(e) });
                }
              }
            }
          });

          stream.on("close", () => {
            log("speculos-event", "close");
            this.emit("disconnect", new DisconnectedDevice("Speculos events stream closed"));
          });

          stream.on("error", err => {
            log("speculos-event", "error", { err: String(err) });
            // If the stream errors before resolve, surface it
            if (!resolved) reject(err);
            this.emit("disconnect", new DisconnectedDevice("Speculos SSE error"));
          });
        })
        .catch(err => {
          if (connectTimer) clearTimeout(connectTimer);
          if (!resolved) reject(err);
          this.tracer.trace("SSE open error", { error: String(err) });
        });
    });
  }

  public async button(but: string): Promise<void> {
    const key = DeviceManagementKitTransportSpeculos.buttonAliases[String(but)];
    if (!key) {
      throw new Error(
        `Unsupported button "${but}" (expected Ll|Rr|LRlr|left|right|both|LEFT|RIGHT|BOTH)`,
      );
    }
    log("speculos-button", "press-and-release", key);
    await this.http.post(`/button/${key}`, { action: "press-and-release" });
  }

  public async exchange(apdu: Buffer): Promise<Buffer> {
    const hex = apdu.toString("hex");
    this.tracer.trace(`=> ${hex}`);
    const { data, statusCode } = await this.dmk.sendApdu({
      sessionId: this.sessionId,
      apdu: Uint8Array.from(apdu),
    });
    const resp = Buffer.from([...data, ...statusCode]);
    this.tracer.trace(`<= ${resp.toString("hex")}`);
    return resp;
  }

  public async close(): Promise<void> {
    if (this.eventStream && typeof (this.eventStream as any).destroy === "function") {
      (this.eventStream as any).destroy();
    }
    this.eventStream = null;
  }
}
