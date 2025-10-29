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
import { deviceControllerClientFactory } from "@ledgerhq/speculos-device-controller";

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

/**
 * Resolve the Speculos base URL from provided options and environment variables
 */
function resolveBaseFromEnv(options: SpeculosHttpTransportOpts): string {
  const configuredHostOrDefault =
    options.baseURL ??
    (typeof process !== "undefined" ? process.env?.SPECULOS_ADDRESS : undefined) ??
    (typeof process !== "undefined" ? process.env?.LLD_SPECULOS_BASE_URL : undefined) ??
    (typeof process !== "undefined" ? process.env?.SPECULOS_BASE_URL : undefined) ??
    "http://127.0.0.1";

  const normalizedHost = configuredHostOrDefault.replace(/\/+$/, "");

  // if an explicit port is already present, use it as-is.
  if (/:\\d+$/.test(normalizedHost) || /:\d+$/.test(normalizedHost)) {
    const baseUrlWithExplicitPort = normalizedHost;
    log("speculos-transport", `using explicit base=${baseUrlWithExplicitPort}`);
    return baseUrlWithExplicitPort;
  }

  const getEnvIfDefinedAndNonEmpty = (key: string): string | undefined => {
    try {
      const value = getEnv(key as any);
      return value != null && String(value).trim() !== "" ? String(value) : undefined;
    } catch {
      return undefined;
    }
  };

  const resolvedApiPort =
    options.apiPort ??
    getEnvIfDefinedAndNonEmpty("SPECULOS_API_PORT") ??
    (typeof process !== "undefined" ? process.env?.SPECULOS_API_PORT : undefined) ??
    (typeof process !== "undefined" ? process.env?.LLD_SPECULOS_HTTP_PORT : undefined) ??
    (typeof process !== "undefined" ? process.env?.SPECULOS_HTTP_PORT : undefined) ??
    "5000";

  const resolvedBaseUrl = `${normalizedHost}:${resolvedApiPort}`;
  log("speculos-transport", `using base=${resolvedBaseUrl}`);
  return resolvedBaseUrl;
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
  // cache entries keyed by base URL, used to serialize APDU exchanges per Speculos instance.
  private static byBase = new Map<string, DmkEntry>();
  private readonly options: SpeculosHttpTransportOpts;
  private readonly baseUrl: string;
  private readonly httpEventDatasource: HttpSpeculosDatasource;
  private eventStream: AnyReadableStream | null = null;

  // emits events coming from Speculos automation SSE stream.
  automationEvents: Subject<Record<string, unknown>> = new Subject();

  constructor(options: SpeculosHttpTransportOpts) {
    super();
    this.options = options;
    this.baseUrl = resolveBaseFromEnv(options);
    this.httpEventDatasource = new HttpSpeculosDatasource(
      this.baseUrl,
      true,
      "ldmk-transport-speculos",
    );
  }

  private static ensureEntry(baseUrl: string, connectionTimeoutMs: number): DmkEntry {
    let deviceManagementEntry = this.byBase.get(baseUrl);
    if (!deviceManagementEntry) {
      const deviceManagementKit = new DeviceManagementKitBuilder()
        .addTransport(speculosTransportFactory(baseUrl, true))
        .addLogger(new ConsoleLogger())
        .build();

      deviceManagementEntry = {
        dmk: deviceManagementKit,
        sendChain: Promise.resolve(),
        timeout: connectionTimeoutMs,
      };

      this.byBase.set(baseUrl, deviceManagementEntry);
    } else {
      deviceManagementEntry.timeout = connectionTimeoutMs;
    }
    return deviceManagementEntry;
  }

  private static async ensureSession(deviceManagementEntry: DmkEntry) {
    if (deviceManagementEntry.sessionId) return;
    if (deviceManagementEntry.connectPromise) return deviceManagementEntry.connectPromise;

    deviceManagementEntry.connectPromise = (async () => {
      const discoveredDevices = await firstValueFrom<DiscoveredDevice[]>(
        deviceManagementEntry.dmk.listenToAvailableDevices({}).pipe(
          filter(deviceList => deviceList.length > 0),
          rxTimeout(deviceManagementEntry.timeout),
        ),
      );

      deviceManagementEntry.sessionId = await deviceManagementEntry.dmk.connect({
        device: discoveredDevices[0],
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
    })();

    try {
      await deviceManagementEntry.connectPromise;
    } finally {
      deviceManagementEntry.connectPromise = undefined;
    }
  }

  static isSupported = async () => true;
  static list = async () => [];
  static listen = (_observer: any) => ({ unsubscribe: () => {} });

  private readonly buttonEnumToControllerInput: {
    [SpeculosButton.BOTH]: "both";
    [SpeculosButton.RIGHT]: "right";
    [SpeculosButton.LEFT]: "left";
  } = {
    [SpeculosButton.BOTH]: "both",
    [SpeculosButton.RIGHT]: "right",
    [SpeculosButton.LEFT]: "left",
  } as const;

  static open = async (options: SpeculosHttpTransportOpts = {}): Promise<SpeculosHttpTransport> => {
    const transportInstance = new SpeculosHttpTransport(options);
    const baseUrl = transportInstance.baseUrl;
    const connectTimeoutMs = options.timeout ?? 10_000;

    this.ensureEntry(baseUrl, connectTimeoutMs);

    const isSseEnabledByEnv =
      typeof process !== "undefined" && process.env?.SPECULOS_TRANSPORT_SSE === "true";

    if (isSseEnabledByEnv) {
      transportInstance.eventStream = await transportInstance.httpEventDatasource.openEventStream(
        eventPayload => {
          log("speculos-event", JSON.stringify(eventPayload));
          transportInstance.automationEvents.next(eventPayload);
        },
        () => {
          log("speculos-event", "close");
          transportInstance.emit("disconnect", new DisconnectedDevice("Speculos exited!"));
        },
      );
    }

    return transportInstance;
  };

  button = (buttonInput: string): Promise<void> => {
    const deviceControllerClient = deviceControllerClientFactory(this.baseUrl);

    const buttonInputForController =
      (this.buttonEnumToControllerInput as any)[buttonInput] ??
      (buttonInput === "Ll"
        ? "left"
        : buttonInput === "Rr"
          ? "right"
          : buttonInput === "LRlr"
            ? "both"
            : buttonInput);

    log("speculos-button", "press-and-release", buttonInputForController);
    return deviceControllerClient.buttonFactory().press(buttonInputForController);
  };

  async exchange(apduCommand: Buffer): Promise<Buffer> {
    const deviceManagementEntry = SpeculosHttpTransport.ensureEntry(
      this.baseUrl,
      this.options.timeout ?? 10_000,
    );

    const performApduExchange = async (): Promise<Buffer> => {
      await SpeculosHttpTransport.ensureSession(deviceManagementEntry);
      const apduHex = apduCommand.toString("hex");
      log("apdu", "=> " + apduHex);

      try {
        const { data, statusCode } = await deviceManagementEntry.dmk.sendApdu({
          sessionId: deviceManagementEntry.sessionId!,
          apdu: new Uint8Array(apduCommand.buffer, apduCommand.byteOffset, apduCommand.byteLength),
        });
        const responseBuffer = Buffer.from([...data, ...statusCode]);
        log("apdu", "<= " + responseBuffer.toString("hex"));
        return responseBuffer;
      } catch {
        // reset session and retry once
        deviceManagementEntry.sessionId = undefined;
        await SpeculosHttpTransport.ensureSession(deviceManagementEntry);

        const { data, statusCode } = await deviceManagementEntry.dmk.sendApdu({
          sessionId: deviceManagementEntry.sessionId!,
          apdu: new Uint8Array(apduCommand.buffer, apduCommand.byteOffset, apduCommand.byteLength),
        });
        const responseBuffer = Buffer.from([...data, ...statusCode]);
        log("apdu", "<= " + responseBuffer.toString("hex"));
        return responseBuffer;
      }
    };

    const chainedExchangePromise = deviceManagementEntry.sendChain.then(
      performApduExchange,
      performApduExchange,
    );

    deviceManagementEntry.sendChain = chainedExchangePromise.then(
      () => {},
      () => {},
    );

    return chainedExchangePromise;
  }

  async close() {
    try {
      const currentEventStream = this.eventStream;
      if (!currentEventStream) return;

      // prefer stream cancel
      if (
        "cancel" in currentEventStream &&
        typeof (currentEventStream as ReadableStream<Uint8Array>).cancel === "function"
      ) {
        await (currentEventStream as ReadableStream<Uint8Array>).cancel();
      } else {
        // fallback
        const nodeReadableStream = currentEventStream as NodeJS.ReadableStream;
        if ("destroy" in nodeReadableStream && typeof nodeReadableStream.destroy === "function") {
          nodeReadableStream.destroy();
        }
      }
    } catch {
      // ignore cleanup errors
    } finally {
      this.eventStream = null;
    }
  }
}
