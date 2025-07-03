import Transport from "@ledgerhq/hw-transport";
import { DisconnectedDevice } from "@ledgerhq/errors";
import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { log, LocalTracer } from "@ledgerhq/logs";
import { Subject, firstValueFrom } from "rxjs";
import { filter, timeout } from "rxjs/operators";
import {
  DeviceManagementKitBuilder,
  DeviceManagementKit,
  DeviceStatus,
  ConsoleLogger,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { speculosTransportFactory } from "@ledgerhq/device-transport-kit-speculos";

export type SpeculosHttpTransportOpts = {
  // base HTTP URL for Speculos (default: http://localhost)
  baseURL?: string;
  // HTTP port for Speculos (default: "5000")
  apiPort?: string;
  // milliseconds to wait for connections and device discovery (default: 5000)
  timeout?: number;
};

export enum SpeculosButton {
  LEFT = "Ll",
  RIGHT = "Rr",
  BOTH = "LRlr",
}

export default class DeviceManagementKitTransportSpeculos extends Transport {
  private static _dmk: DeviceManagementKitTransportSpeculos | null = null;
  private readonly http: AxiosInstance;
  private eventStream: NodeJS.ReadableStream | null = null;
  private readonly dmk: DeviceManagementKit;
  private readonly sessionId: string;
  private static readonly buttonMap = {
    LEFT: "left",
    RIGHT: "right",
    BOTH: "both",
  } as const;

  public readonly automationEvents = new Subject<Record<string, unknown>>();
  public readonly tracer = new LocalTracer("SpeculosDmkHttpTransport");

  private constructor(http: AxiosInstance, dmk: DeviceManagementKit, sessionId: string) {
    super();
    this.http = http;
    this.dmk = dmk;
    this.sessionId = sessionId;

    // emit DMK disconnects as Transport disconnects
    this.dmk.getDeviceSessionState({ sessionId }).subscribe(({ deviceStatus }) => {
      if (deviceStatus === DeviceStatus.NOT_CONNECTED) {
        this.emit("disconnect");
      }
    });

    // open SSE stream for automation events
    this.http({ url: "/events?stream=true", responseType: "stream" })
      .then((res: AxiosResponse) => {
        this.eventStream = res.data as NodeJS.ReadableStream;
        this.eventStream.on("data", (chunk: Buffer) => {
          log("speculos-event", chunk.toString());
          for (const line of chunk.toString().split("\n")) {
            if (line.startsWith("data: ")) {
              try {
                this.automationEvents.next(JSON.parse(line.slice(6)));
              } catch (e) {
                log("speculos-event", "malformed JSON", { line, error: e });
              }
            }
          }
        });
        this.eventStream.on("close", () => {
          log("speculos-event", "close");
          this.emit("disconnect", new DisconnectedDevice("Speculos exited"));
        });
      })
      .catch(error => this.tracer.trace("SSE open error", { error }));
  }

  public static isSupported(): Promise<boolean> {
    return Promise.resolve(true);
  }

  public static list(): Promise<[]> {
    return Promise.resolve([]);
  }

  public static listen(_obs: any) {
    return { unsubscribe: () => {} };
  }

  // opens (or reuses) a single transport connected to Speculos.
  public static async open(
    opts: { baseURL?: string; apiPort?: string; timeout?: number } = {},
  ): Promise<DeviceManagementKitTransportSpeculos> {
    if (DeviceManagementKitTransportSpeculos._dmk) {
      return DeviceManagementKitTransportSpeculos._dmk;
    }

    const {
      baseURL = "http://localhost",
      apiPort = "5000",
      timeout: connectTimeout = 10000,
    } = opts;
    const urlString = `${baseURL}:${apiPort}`;

    // build and start DMK over Speculos
    const dmk = new DeviceManagementKitBuilder()
      .addTransport(speculosTransportFactory(urlString))
      .addLogger(new ConsoleLogger())
      .build();

    // wait for device discovery
    const devices = await firstValueFrom<DiscoveredDevice[]>(
      dmk.listenToAvailableDevices({}).pipe(
        filter(list => list.length > 0),
        timeout(connectTimeout),
      ),
    );
    const [device] = devices;

    // establish session
    const sessionId = await dmk.connect({
      device,
      sessionRefresherOptions: { isRefresherDisabled: true },
    });

    // axios client for APDUs
    const http = axios.create({ baseURL: urlString, timeout: connectTimeout });

    const transport = new DeviceManagementKitTransportSpeculos(http, dmk, sessionId);
    DeviceManagementKitTransportSpeculos._dmk = transport;
    return transport;
  }

  // press and release a simulated button
  public async button(
    but: keyof typeof DeviceManagementKitTransportSpeculos.buttonMap | string,
  ): Promise<void> {
    const key = typeof but === "string" ? but : DeviceManagementKitTransportSpeculos.buttonMap[but];
    log("speculos-button", "press-and-release", key);
    await this.http.post(`/button/${key}`, { action: "press-and-release" });
  }

  // APDU exchange via DMK
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

  // close the SSE stream
  public async close(): Promise<void> {
    if (this.eventStream) {
      (this.eventStream as any).destroy();
      this.eventStream = null;
    }
  }
}
