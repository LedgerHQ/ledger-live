import { BehaviorSubject, EMPTY, Observable, of } from "rxjs";
import { map } from "rxjs/operators";
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

export const HTTP_PROXY_TRANSPORT_IDENTIFIER = "HTTP_PROXY_TRANSPORT";
const SYNTHETIC_DEVICE_ID = "http-proxy-device";

export const httpProxyUrlSubject = new BehaviorSubject<string | null>(null);

// Stringify an unknown error payload without falling back to "[object Object]".
const stringifyError = (err: unknown): string => {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  return JSON.stringify(err);
};

export class HttpProxyDmkTransport implements DmkTransport {
  private readonly urlSubject: BehaviorSubject<string | null>;
  private readonly deviceModelId: DeviceModelId;
  private readonly args: TransportArgs;

  constructor(
    args: TransportArgs,
    urlSubject: BehaviorSubject<string | null>,
    deviceModelId: DeviceModelId = DeviceModelId.NANO_X,
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
    return this.urlSubject.pipe(map(url => (url ? [this.syntheticDevice(url)] : [])));
  }

  startDiscovering(): Observable<TransportDiscoveredDevice> {
    const url = this.urlSubject.getValue();
    return url ? of(this.syntheticDevice(url)) : EMPTY;
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
        const body = (await resp.json()) as { data?: string; error?: unknown };
        if (body.error) {
          return Left(new UnknownDeviceError(stringifyError(body.error)));
        }
        if (!body.data) {
          return Left(new UnknownDeviceError("empty response from proxy"));
        }
        const bytes = hexaStringToBuffer(body.data);
        if (!bytes) {
          return Left(new UnknownDeviceError(`invalid hex in proxy response: ${body.data}`));
        }
        if (bytes.length < 2) {
          return Left(new UnknownDeviceError(`malformed proxy response: ${body.data}`));
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
      deviceModel: this.args.deviceModelDataSource.getDeviceModel({ id: this.deviceModelId }),
      type: "USB",
      transport: HTTP_PROXY_TRANSPORT_IDENTIFIER,
      sendApdu,
    });

    return Right(connectedDevice);
  }

  async disconnect(): Promise<Either<DmkError, void>> {
    return Right(undefined);
  }

  private syntheticDevice(url: string): TransportDiscoveredDevice {
    return {
      id: SYNTHETIC_DEVICE_ID,
      deviceModel: this.args.deviceModelDataSource.getDeviceModel({ id: this.deviceModelId }),
      transport: HTTP_PROXY_TRANSPORT_IDENTIFIER,
      name: `HTTP Proxy (${url})`,
    };
  }
}

export const httpProxyTransportFactory =
  (urlSubject: BehaviorSubject<string | null>, deviceModelId?: DeviceModelId): TransportFactory =>
  (args: TransportArgs) =>
    new HttpProxyDmkTransport(args, urlSubject, deviceModelId);
