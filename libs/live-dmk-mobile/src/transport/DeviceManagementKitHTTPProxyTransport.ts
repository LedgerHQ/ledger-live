import {
  DeviceManagementKit,
  DeviceStatus,
  SendApduEmptyResponseError,
  DeviceDisconnectedWhileSendingError,
  DeviceDisconnectedBeforeSendingApdu,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { DisconnectedDevice } from "@ledgerhq/errors";
import Transport from "@ledgerhq/hw-transport";
import { firstValueFrom, type Subscription } from "rxjs";
import { filter, timeout } from "rxjs/operators";
import { HTTP_PROXY_TRANSPORT_IDENTIFIER, httpProxyUrlSubject } from "./HttpProxyDmkTransport";
import { getDeviceManagementKit } from "../hooks/useDeviceManagementKit";

export class DeviceManagementKitHTTPProxyTransport extends Transport {
  readonly dmk: DeviceManagementKit;
  sessionId: string;
  private readonly disconnectSubscription?: Subscription;

  private static activeUrl: string | null = null;
  private static activeSessionId: string | null = null;
  private static inFlight: { url: string; promise: Promise<string> } | null = null;

  constructor(dmk: DeviceManagementKit, sessionId: string) {
    super();
    this.dmk = dmk;
    this.sessionId = sessionId;
    this.disconnectSubscription = this.listenToDisconnect();
  }

  static normalizeUrl(raw: string): string {
    return raw.replace(/^ws(s?):\/\//, "http$1://");
  }

  private static async ensureSession(dmk: DeviceManagementKit, url: string): Promise<string> {
    if (this.activeSessionId && this.activeUrl === url) return this.activeSessionId;
    if (this.inFlight?.url === url) return this.inFlight.promise;
    if (this.inFlight) {
      // A connect for a different URL is in flight — wait for it to settle so the
      // shared URL subject and DMK transport state don't get clobbered mid-connect.
      await this.inFlight.promise.catch(() => {});
      if (this.activeSessionId && this.activeUrl === url) return this.activeSessionId;
    }

    const promise = (async () => {
      httpProxyUrlSubject.next(url);
      const devices = await firstValueFrom<DiscoveredDevice[]>(
        dmk.listenToAvailableDevices({ transport: HTTP_PROXY_TRANSPORT_IDENTIFIER }).pipe(
          filter(list => list.length > 0),
          timeout(10_000),
        ),
      );
      const sessionId = await dmk.connect({
        device: devices[0],
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
      this.activeSessionId = sessionId;
      this.activeUrl = url;
      return sessionId;
    })();

    this.inFlight = { url, promise };

    try {
      return await promise;
    } finally {
      if (this.inFlight?.promise === promise) {
        this.inFlight = null;
      }
    }
  }

  static async open(rawUrl: string): Promise<DeviceManagementKitHTTPProxyTransport> {
    const url = this.normalizeUrl(rawUrl);
    const dmk = getDeviceManagementKit();
    const sessionId = await this.ensureSession(dmk, url);
    return new DeviceManagementKitHTTPProxyTransport(dmk, sessionId);
  }

  async exchange(
    apdu: Buffer,
    { abortTimeoutMs }: { abortTimeoutMs?: number } = {},
  ): Promise<Buffer> {
    return this.dmk
      .sendApdu({
        sessionId: this.sessionId,
        apdu: new Uint8Array(apdu),
        abortTimeout: abortTimeoutMs,
      })
      .then(({ data, statusCode }) => Buffer.from([...data, ...statusCode]))
      .catch(error => {
        if (
          error instanceof SendApduEmptyResponseError ||
          error instanceof DeviceDisconnectedWhileSendingError ||
          error instanceof DeviceDisconnectedBeforeSendingApdu
        ) {
          throw new DisconnectedDevice();
        }
        throw error;
      });
  }

  close(): Promise<void> {
    this.disconnectSubscription?.unsubscribe();
    return Promise.resolve();
  }

  listenToDisconnect() {
    let isDisconnected = false;
    // If the observable emits NOT_CONNECTED synchronously during subscribe(), `subscription`
    // is still undefined when handleDisconnect runs — set this flag and tear it down right
    // after subscribe() returns so we don't leak a live subscription.
    let pendingUnsubscribe = false;
    let subscription: Subscription | undefined;
    const handleDisconnect = () => {
      if (isDisconnected) return;
      isDisconnected = true;
      // Only clear the shared cache if it still refers to this transport's session.
      // A late event from a stale instance (e.g. after the user switched URLs) must not
      // wipe the entry of the currently-active session and force a needless reconnect.
      if (DeviceManagementKitHTTPProxyTransport.activeSessionId === this.sessionId) {
        DeviceManagementKitHTTPProxyTransport.activeSessionId = null;
        DeviceManagementKitHTTPProxyTransport.activeUrl = null;
      }
      this.emit("disconnect");
      if (subscription) subscription.unsubscribe();
      else pendingUnsubscribe = true;
    };
    subscription = this.dmk.getDeviceSessionState({ sessionId: this.sessionId }).subscribe({
      next: (state: { deviceStatus: DeviceStatus }) => {
        if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) handleDisconnect();
      },
      error: handleDisconnect,
      complete: handleDisconnect,
    });
    if (pendingUnsubscribe) subscription.unsubscribe();
    return subscription;
  }

  static readonly isSupported = async () => true;
  static readonly list = async () => [];
  static readonly listen = (_observer: unknown) => ({ unsubscribe: () => {} });
}
