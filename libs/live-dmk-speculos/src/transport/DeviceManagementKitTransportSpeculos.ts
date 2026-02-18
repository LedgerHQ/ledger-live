import Transport from "@ledgerhq/hw-transport";
import { log } from "@ledgerhq/logs";
import { Subject, firstValueFrom } from "rxjs";
import { filter, timeout as rxTimeout } from "rxjs/operators";
import {
  DeviceManagementKitBuilder,
  DeviceManagementKit,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { speculosTransportFactory } from "@ledgerhq/device-transport-kit-speculos";
import { getEnv } from "@ledgerhq/live-env";
import { ButtonKey, deviceControllerClientFactory } from "@ledgerhq/speculos-device-controller";

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

type DmkEntry = {
  dmk: DeviceManagementKit;
  sessionId?: string;
  connectPromise?: Promise<void>;
  timeout: number;
};

type ControllerButton = "left" | "right" | "both";

// temp type fix until DeviceControllerClient exposes buttonFactory type
type ButtonsController = {
  left(): Promise<void>;
  right(): Promise<void>;
  both(): Promise<void>;
  press(key: ButtonKey): Promise<void>;
  pressSequence(keys: ButtonKey[], delayMs?: number): Promise<void>;
};

export default class SpeculosHttpTransport extends Transport {
  static readonly byBase = new Map<string, DmkEntry>();
  private readonly options: SpeculosHttpTransportOpts;
  private readonly baseUrl: string;
  private readonly buttonEnumToControllerInput: Record<SpeculosButton, ControllerButton> = {
    [SpeculosButton.BOTH]: "both",
    [SpeculosButton.RIGHT]: "right",
    [SpeculosButton.LEFT]: "left",
  } as const;
  private eventStream: ReadableStream<Uint8Array> | null = null;
  private buttonClient: ButtonsController | undefined;

  readonly dmk: DeviceManagementKit;
  sessionId: string;

  // emits events coming from Speculos automation SSE stream.
  automationEvents: Subject<Record<string, unknown>> = new Subject();

  constructor(options: SpeculosHttpTransportOpts, dmk: DeviceManagementKit, sessionId: string) {
    super();
    this.options = options;
    this.baseUrl = SpeculosHttpTransport.resolveBaseFromEnv(options);
    this.dmk = dmk;
    this.sessionId = sessionId;
  }

  private static resolveBaseFromEnv(options: SpeculosHttpTransportOpts): string {
    const configuredHostOrDefault =
      options.baseURL ?? process?.env?.SPECULOS_ADDRESS ?? "http://127.0.0.1";

    const normalizedHost = configuredHostOrDefault.replace(/\/+$/, "");

    // if an explicit port is already present, use it as-is
    if (/:\d+$/.test(normalizedHost)) {
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
      process?.env?.SPECULOS_API_PORT ??
      "5000";

    const resolvedBaseUrl = `${normalizedHost}:${resolvedApiPort}`;
    log("speculos-transport", `using base=${resolvedBaseUrl}`);
    return resolvedBaseUrl;
  }

  private static ensureEntry(baseUrl: string, connectionTimeoutMs: number): DmkEntry {
    let deviceManagementEntry = this.byBase.get(baseUrl);
    if (!deviceManagementEntry) {
      const deviceManagementKit = new DeviceManagementKitBuilder()
        .addTransport(speculosTransportFactory(baseUrl, true))
        .build();

      deviceManagementEntry = {
        dmk: deviceManagementKit,
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

  static async open(options: SpeculosHttpTransportOpts = {}): Promise<SpeculosHttpTransport> {
    const baseUrl = this.resolveBaseFromEnv(options);
    const connectTimeoutMs = options.timeout ?? 10_000;
    const entry = this.ensureEntry(baseUrl, connectTimeoutMs);

    await this.ensureSession(entry);

    if (!entry.sessionId) {
      throw new Error("Failed to establish DMK session with Speculos");
    }

    return new SpeculosHttpTransport(options, entry.dmk, entry.sessionId);
  }

  private getButtonClient() {
    if (!this.buttonClient) {
      this.buttonClient = deviceControllerClientFactory(this.baseUrl).buttonFactory();
    }
    return this.buttonClient;
  }

  async button(buttonInput: ButtonKey | SpeculosButton): Promise<void> {
    const resolved: ButtonKey =
      buttonInput === SpeculosButton.LEFT ||
      buttonInput === SpeculosButton.RIGHT ||
      buttonInput === SpeculosButton.BOTH
        ? this.buttonEnumToControllerInput[buttonInput]
        : buttonInput;

    log("speculos-button", "press-and-release", resolved);
    return await this.getButtonClient().press(resolved);
  }

  async exchange(apduCommand: Buffer): Promise<Buffer> {
    try {
      const { data, statusCode } = await this.dmk.sendApdu({
        sessionId: this.sessionId,
        apdu: new Uint8Array(apduCommand.buffer, apduCommand.byteOffset, apduCommand.byteLength),
      });
      const responseBuffer = Buffer.from([...data, ...statusCode]);
      return responseBuffer;
    } catch {
      const deviceManagementEntry = SpeculosHttpTransport.ensureEntry(
        this.baseUrl,
        this.options.timeout ?? 10_000,
      );
      deviceManagementEntry.sessionId = undefined;
      await SpeculosHttpTransport.ensureSession(deviceManagementEntry);
      if (!deviceManagementEntry.sessionId) {
        throw new Error("Failed to re-establish DMK session with Speculos");
      }
      this.sessionId = deviceManagementEntry.sessionId;

      const { data, statusCode } = await this.dmk.sendApdu({
        sessionId: this.sessionId,
        apdu: new Uint8Array(apduCommand.buffer, apduCommand.byteOffset, apduCommand.byteLength),
      });
      const responseBuffer = Buffer.from([...data, ...statusCode]);
      return responseBuffer;
    }
  }

  async close() {
    try {
      const s = this.eventStream;
      if (!s) return;
      if (typeof s.cancel === "function") {
        await s.cancel();
      }
    } catch {
      // ignore cleanup errors
    } finally {
      this.eventStream = null;
      this.buttonClient = undefined;
      this.automationEvents.complete?.();
    }
  }
}
