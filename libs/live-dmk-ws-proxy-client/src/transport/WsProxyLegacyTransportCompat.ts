import {
  DeviceManagementKit,
  DeviceStatus,
  SendApduEmptyResponseError,
  DeviceDisconnectedWhileSendingError,
  DeviceDisconnectedBeforeSendingApdu,
} from "@ledgerhq/device-management-kit";
import { DisconnectedDevice } from "@ledgerhq/errors";
import Transport from "@ledgerhq/hw-transport";
import { LocalTracer, TraceContext } from "@ledgerhq/logs";
import { Subscription, firstValueFrom } from "rxjs";
import { first, tap, timeout } from "rxjs/operators";
import { WS_PROXY_IDENTIFIER } from "./WsProxyTransport";

const tracer = new LocalTracer("live-dmk", {
  function: "WsProxyLegacyTransportCompat",
});
const APDU_LOG_PREVIEW_HEX_LENGTH = 32;

const toErrorLogData = (error: unknown): Record<string, unknown> => {
  const base: Record<string, unknown> = { error };
  if (error instanceof Error) {
    base.name = error.name;
    base.message = error.message;
  }
  if (error && typeof error === "object" && "_tag" in error && typeof error._tag === "string") {
    base.tag = error._tag;
  }
  return base;
};

const toHexPreview = (hex: string): string =>
  hex.length > APDU_LOG_PREVIEW_HEX_LENGTH ? `${hex.slice(0, APDU_LOG_PREVIEW_HEX_LENGTH)}…` : hex;

/**
 * Bridge transport that extends the legacy hw-transport Transport class
 * and delegates to a DMK session obtained through the WS proxy transport.
 *
 * Exposes `sessionId` and `dmk` so that DMK device actions
 * (ConnectApp, EthSigner, etc.) work transparently through the proxy.
 */
export class WsProxyLegacyTransportCompat extends Transport {
  sessionId: string;
  dmk: DeviceManagementKit;
  private disconnectSubscription: Subscription | null = null;

  constructor(dmk: DeviceManagementKit, sessionId: string) {
    super();
    this.sessionId = sessionId;
    this.dmk = dmk;
    this.tracer = tracer;
    this.disconnectSubscription = this.listenToDisconnect();
  }

  /**
   * Open a DMK session via the WS proxy transport.
   * Called by the transport module's `open` handler.
   *
   * @param deviceId - The discovered device ID (without the "wsHidProxy|" prefix)
   * @param timeoutMs - Optional connection timeout
   * @param _context - Trace context (unused here)
   * @param dmk - DMK instance (defaults to global instance from live-dmk-mobile)
   */
  static async open(
    deviceId: string,
    timeoutMs?: number,
    _context?: TraceContext,
    dmk?: DeviceManagementKit,
  ): Promise<WsProxyLegacyTransportCompat> {
    if (!dmk) {
      throw new Error(
        "WsProxyLegacyTransportCompat.open requires a DMK instance. " +
          "Pass it explicitly or ensure the global DMK is initialized.",
      );
    }

    tracer.trace("[open] start", { deviceId, timeoutMs });

    try {
      tracer.trace("[open] waiting for device in discovery");
      const devices = await firstValueFrom(
        dmk.listenToAvailableDevices({ transport: WS_PROXY_IDENTIFIER }).pipe(
          first(list => list.some(d => d.id === deviceId)),
          timeoutMs ? timeout(timeoutMs) : tap(),
        ),
      );

      const device = devices.find(d => d.id === deviceId);
      if (!device) {
        throw new Error(`Device ${deviceId} not found in WS proxy discovery`);
      }

      tracer.trace("[open] device found, calling dmk.connect");

      const sessionId = await dmk.connect({
        device,
        sessionRefresherOptions: { isRefresherDisabled: true },
      });

      tracer.trace("[open] connected", { sessionId });

      return new WsProxyLegacyTransportCompat(dmk, sessionId);
    } catch (err) {
      tracer.trace("[open] error", toErrorLogData(err));
      throw err;
    }
  }

  async exchange(apdu: Buffer, { abortTimeoutMs }: { abortTimeoutMs?: number } = {}) {
    const apduHex = apdu.toString("hex");
    tracer.trace("[exchange] sending apdu", {
      sessionId: this.sessionId,
      apduByteLength: apdu.length,
      apduHexPreview: toHexPreview(apduHex),
      abortTimeoutMs,
    });
    return this.dmk
      .sendApdu({
        sessionId: this.sessionId,
        apdu: new Uint8Array(apdu),
        abortTimeout: abortTimeoutMs,
      })
      .then((apduResponse: { data: Uint8Array; statusCode: Uint8Array }): Buffer => {
        const statusCodeHex = Buffer.from(apduResponse.statusCode).toString("hex");
        tracer.trace("[exchange] apdu response received", {
          sessionId: this.sessionId,
          responseDataLength: apduResponse.data.length,
          statusCodeHex,
        });
        return Buffer.from([...apduResponse.data, ...apduResponse.statusCode]);
      })
      .catch(error => {
        tracer.trace("[exchange] sendApdu failed", {
          sessionId: this.sessionId,
          ...toErrorLogData(error),
        });
        if (
          error instanceof SendApduEmptyResponseError ||
          error instanceof DeviceDisconnectedWhileSendingError ||
          error instanceof DeviceDisconnectedBeforeSendingApdu
        ) {
          tracer.trace("[exchange] mapping sendApdu failure to DisconnectedDevice", {
            sessionId: this.sessionId,
            ...toErrorLogData(error),
          });
          throw new DisconnectedDevice();
        }
        throw error;
      });
  }

  close(): Promise<void> {
    this.disconnectSubscription?.unsubscribe();
    this.disconnectSubscription = null;
    return Promise.resolve();
  }

  listenToDisconnect(): Subscription {
    const subscription = this.dmk.getDeviceSessionState({ sessionId: this.sessionId }).subscribe({
      next: (state: { deviceStatus: DeviceStatus }) => {
        if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
          tracer.trace("[listenToDisconnect] device disconnected");
          this.emit("disconnect");
        }
      },
      error: (error: unknown) => {
        tracer.trace("[listenToDisconnect] error", { error });
        this.emit("disconnect");
        this.disconnectSubscription = null;
      },
      complete: () => {
        tracer.trace("[listenToDisconnect] complete");
        this.emit("disconnect");
        this.disconnectSubscription = null;
      },
    });
    return subscription;
  }
}
