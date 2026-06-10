import { BehaviorSubject, EMPTY, from, Observable, of } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { Either, Left, Right } from "purify-ts";
import {
  ApduResponse,
  DeviceModelId,
  TransportConnectedDevice,
  UnknownDeviceError,
  bufferToHexaString,
  hexaStringToBuffer,
  type ConnectError,
  type DmkError,
  type Transport as DmkTransport,
  type TransportArgs,
  type TransportDiscoveredDevice,
  type TransportFactory,
} from "@ledgerhq/device-management-kit";
import { ledgerToDmkDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { DeviceModelId as LedgerDeviceModelId } from "@ledgerhq/types-devices";

export const HTTP_PROXY_TRANSPORT_IDENTIFIER = "HTTP_PROXY_TRANSPORT";
const SYNTHETIC_DEVICE_ID = "http-proxy-device";

export const DEFAULT_HTTP_PROXY_DEVICE_MODEL_ID = DeviceModelId.NANO_X;

export const httpProxyUrlSubject = new BehaviorSubject<string | null>(null);

// Stringify an unknown error payload without falling back to "[object Object]".
const stringifyError = (err: unknown): string => {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  return JSON.stringify(err);
};

const ledgerDeviceModelIds = new Set<string>(Object.values(LedgerDeviceModelId));

const isLedgerDeviceModelId = (value: unknown): value is LedgerDeviceModelId =>
  typeof value === "string" && ledgerDeviceModelIds.has(value);

const metadataUrl = (url: string): string => `${url.replace(/\/$/, "")}/metadata`;

export class HttpProxyDmkTransport implements DmkTransport {
  private readonly urlSubject: BehaviorSubject<string | null>;
  private readonly deviceModelId: DeviceModelId;
  private readonly args: TransportArgs;

  constructor(
    args: TransportArgs,
    urlSubject: BehaviorSubject<string | null>,
    deviceModelId: DeviceModelId = DEFAULT_HTTP_PROXY_DEVICE_MODEL_ID,
  ) {
    this.args = args;
    this.urlSubject = urlSubject;
    this.deviceModelId = deviceModelId;
  }

  getIdentifier(): string {
    return HTTP_PROXY_TRANSPORT_IDENTIFIER;
  }

  isSupported(): boolean {
    return true;
  }

  listenToAvailableDevices(): Observable<TransportDiscoveredDevice[]> {
    return this.urlSubject.pipe(
      switchMap(url =>
        url ? from(this.syntheticDevice(url)).pipe(map(device => [device])) : of([]),
      ),
    );
  }

  startDiscovering(): Observable<TransportDiscoveredDevice> {
    const url = this.urlSubject.getValue();
    return url ? from(this.syntheticDevice(url)) : EMPTY;
  }

  stopDiscovering(): void {
    // Nothing to clean up.
  }

  async connect({
    deviceId,
  }: {
    deviceId: string;
    onDisconnect: (deviceId: string) => void;
  }): Promise<Either<ConnectError, TransportConnectedDevice>> {
    // Capture the URL at connect time so the session is bound to one endpoint
    // for its lifetime — subject changes after this point only affect new sessions.
    const url = this.urlSubject.getValue();
    if (!url) {
      return Left(new UnknownDeviceError("HTTP proxy URL not set"));
    }
    const deviceModelId = await this.resolveDeviceModelId(url);

    const sendApdu = async (apdu: Uint8Array): Promise<Either<DmkError, ApduResponse>> => {
      try {
        const apduHex = bufferToHexaString(apdu, false);
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ apduHex }),
        });
        if (!resp.ok) {
          return Left(new UnknownDeviceError(`HTTP ${resp.status}`));
        }
        const body: unknown = await resp.json();
        if (typeof body !== "object" || body === null) {
          return Left(new UnknownDeviceError("invalid response from proxy"));
        }
        const error = "error" in body ? body.error : undefined;
        if (error) {
          return Left(new UnknownDeviceError(stringifyError(error)));
        }
        const data = "data" in body ? body.data : undefined;
        if (typeof data !== "string" || !data) {
          return Left(new UnknownDeviceError("empty response from proxy"));
        }
        const bytes = hexaStringToBuffer(data);
        if (!bytes) {
          return Left(new UnknownDeviceError(`invalid hex in proxy response: ${data}`));
        }
        if (bytes.length < 2) {
          return Left(new UnknownDeviceError(`malformed proxy response: ${data}`));
        }
        return Right(
          new ApduResponse({
            data: bytes.slice(0, -2),
            statusCode: bytes.slice(-2),
          }),
        );
      } catch (err) {
        // Do NOT invoke DMK's onDisconnect — it signals physical disconnect and wipes
        // the session from the registry. A failed HTTP request should be retryable.
        const message = err instanceof Error ? err.message : String(err);
        return Left(new UnknownDeviceError(message));
      }
    };

    const connectedDevice = new TransportConnectedDevice({
      id: deviceId,
      deviceModel: this.args.deviceModelDataSource.getDeviceModel({ id: deviceModelId }),
      type: "USB",
      transport: HTTP_PROXY_TRANSPORT_IDENTIFIER,
      sendApdu,
    });

    return Right(connectedDevice);
  }

  async disconnect(): Promise<Either<DmkError, void>> {
    return Right(undefined);
  }

  private async resolveDeviceModelId(url: string): Promise<DeviceModelId> {
    try {
      const response = await fetch(metadataUrl(url), {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const body: unknown = await response.json();
        const deviceModelId =
          typeof body === "object" && body !== null && "deviceModelId" in body
            ? body.deviceModelId
            : null;

        if (isLedgerDeviceModelId(deviceModelId)) {
          return ledgerToDmkDeviceIdMap[deviceModelId];
        }
      }
    } catch {
      // Older proxies do not expose metadata. Keep the previous fallback.
    }

    return this.deviceModelId;
  }

  private async syntheticDevice(url: string): Promise<TransportDiscoveredDevice> {
    const deviceModelId = await this.resolveDeviceModelId(url);

    return {
      id: SYNTHETIC_DEVICE_ID,
      deviceModel: this.args.deviceModelDataSource.getDeviceModel({ id: deviceModelId }),
      transport: HTTP_PROXY_TRANSPORT_IDENTIFIER,
      name: `HTTP Proxy (${url})`,
    };
  }
}

export const httpProxyTransportFactory =
  (urlSubject: BehaviorSubject<string | null>, deviceModelId?: DeviceModelId): TransportFactory =>
  (args: TransportArgs) =>
    new HttpProxyDmkTransport(args, urlSubject, deviceModelId);
