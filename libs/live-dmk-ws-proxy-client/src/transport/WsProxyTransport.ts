import { BehaviorSubject, Observable, Subject, Subscription } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";
import { Right, Left } from "purify-ts";
import { v4 as uuid } from "uuid";
import type {
  DeviceId,
  DeviceModelId,
  TransportIdentifier,
  TransportArgs,
  Transport,
  TransportFactory,
  DisconnectHandler,
  TransportDiscoveredDevice,
  SendApduResult,
} from "@ledgerhq/device-management-kit";
import {
  TransportConnectedDevice,
  ApduResponse,
  OpeningConnectionError,
  formatApduSentLog,
  formatApduReceivedLog,
} from "@ledgerhq/device-management-kit";

import type { WsProxyDeviceInfo, WsServerMessage } from "@ledgerhq/live-dmk-ws-proxy-shared";
import { WsProxyDeviceConnection } from "./WsProxyDeviceConnection";
import { encodeApdu, decodeApduResponseHex } from "./apdu";
import {
  createConnectMessage,
  createDisconnectMessage,
  createSendApduMessage,
  parseServerMessage,
} from "./messaging";

export const WS_PROXY_IDENTIFIER: TransportIdentifier = "WS-PROXY";

const proxyUrl$ = new BehaviorSubject<string | null>(null);
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

const createRequestId = (prefix: string): string => `${prefix}-${uuid()}`;

/**
 * Set the unique WS proxy URL. Pass null to deactivate.
 */
export const setWsProxyUrl = (url: string | null): void => {
  proxyUrl$.next(url);
};

type WsConnection = {
  ws: WebSocket;
  url: string;
  devices$: BehaviorSubject<WsProxyDeviceInfo[]>;
  devicesSubscription?: Subscription;
};

class WsProxyTransport implements Transport {
  private readonly args: TransportArgs;
  private readonly logger: ReturnType<TransportArgs["loggerServiceFactory"]>;
  private wsConnection: WsConnection | null = null;
  private discoverySubscription: Subscription | null = null;
  private deviceConnectionsByDeviceId = new Map<DeviceId, WsProxyDeviceConnection>();
  private apduQueueByDeviceId = new Map<DeviceId, Promise<void>>();

  private sharedDevices$ = new BehaviorSubject<TransportDiscoveredDevice[]>([]);
  private urlManagerSubscription: Subscription | null = null;

  constructor(args: TransportArgs) {
    this.args = args;
    this.logger = this.args.loggerServiceFactory("WsProxyTransport");
    this.startUrlManager();
  }

  getIdentifier(): TransportIdentifier {
    return WS_PROXY_IDENTIFIER;
  }

  isSupported(): boolean {
    return true;
  }

  listenToAvailableDevices(): Observable<TransportDiscoveredDevice[]> {
    this.ensureWsConnectionIfNeeded("listenToAvailableDevices");
    return this.sharedDevices$.asObservable();
  }

  startDiscovering(): Observable<TransportDiscoveredDevice> {
    const subject = new Subject<TransportDiscoveredDevice>();
    const seen = new Set<DeviceId>();

    this.discoverySubscription = this.listenToAvailableDevices().subscribe({
      next: devices => {
        for (const device of devices) {
          if (!seen.has(device.id)) {
            seen.add(device.id);
            subject.next(device);
          }
        }
      },
      error: err => subject.error(err),
      complete: () => subject.complete(),
    });

    return subject.asObservable();
  }

  stopDiscovering(): void {
    if (this.discoverySubscription) {
      this.discoverySubscription.unsubscribe();
      this.discoverySubscription = null;
    }
  }

  async connect(params: {
    deviceId: DeviceId;
    onDisconnect: DisconnectHandler;
  }): ReturnType<Transport["connect"]> {
    const conn = this.wsConnection;
    if (!conn || conn.ws.readyState !== WebSocket.OPEN) {
      return Left(new OpeningConnectionError(new Error("WebSocket not connected")));
    }

    const availableDevice = conn.devices$.getValue().some(device => device.id === params.deviceId);
    if (!availableDevice) {
      return Left(
        new OpeningConnectionError(
          new Error(`Device ${params.deviceId} is not available on proxy`),
        ),
      );
    }
    let deviceConnection = this.deviceConnectionsByDeviceId.get(params.deviceId);
    if (!deviceConnection || deviceConnection.socket !== conn.ws) {
      deviceConnection = new WsProxyDeviceConnection(params.deviceId, conn.ws);
      this.deviceConnectionsByDeviceId.set(params.deviceId, deviceConnection);
    }
    deviceConnection.setOnDisconnect(params.onDisconnect);

    try {
      const requestId = createRequestId("connect");
      const connectResult = await new Promise<{
        sessionId: string;
        deviceModel: { id: string; productName: string };
      }>((resolve, reject) => {
        deviceConnection.addPendingConnect(requestId, {
          resolve,
          reject,
        });
        try {
          conn.ws.send(JSON.stringify(createConnectMessage(params.deviceId, requestId)));
        } catch (sendError) {
          const error = sendError instanceof Error ? sendError : new Error(String(sendError));
          const didRejectPending = deviceConnection.rejectPendingRequest(requestId, error);
          if (!didRejectPending) {
            reject(error);
          }
        }
      });

      const deviceModel = this.args.deviceModelDataSource.getDeviceModel({
        id: connectResult.deviceModel.id as DeviceModelId,
      });

      const sendApdu = async (
        apdu: Uint8Array,
        _triggersDisconnection?: boolean,
        abortTimeoutMs?: number,
      ): Promise<SendApduResult> => this.sendApduOverWs(deviceConnection, apdu, abortTimeoutMs);

      const connectedDevice = new TransportConnectedDevice({
        id: params.deviceId,
        deviceModel,
        type: "USB",
        transport: WS_PROXY_IDENTIFIER,
        sendApdu,
      });

      return Right(connectedDevice);
    } catch (err) {
      this.logger.error("connect failed", {
        data: {
          error: err,
          deviceId: params.deviceId,
        },
      });
      return Left(new OpeningConnectionError(err));
    }
  }

  async disconnect(params: {
    connectedDevice: TransportConnectedDevice;
  }): ReturnType<Transport["disconnect"]> {
    const conn = this.wsConnection;
    if (!conn || conn.ws.readyState !== WebSocket.OPEN) {
      return Right(undefined);
    }
    const deviceConnection = this.deviceConnectionsByDeviceId.get(params.connectedDevice.id);
    if (!deviceConnection) {
      return Right(undefined);
    }
    deviceConnection.setOnDisconnect(null);

    const requestId = createRequestId("disconnect");
    try {
      conn.ws.send(JSON.stringify(createDisconnectMessage(params.connectedDevice.id, requestId)));
    } catch (err) {
      this.logger.error("disconnect failed", {
        data: {
          error: err,
          deviceId: params.connectedDevice.id,
        },
      });
    }
    this.clearDeviceConnection(deviceConnection, false);
    return Right(undefined);
  }

  private startUrlManager(): void {
    if (this.urlManagerSubscription) return;

    this.urlManagerSubscription = proxyUrl$.pipe(distinctUntilChanged()).subscribe(url => {
      this.reconcileConnection(url);
    });
  }

  private reconcileConnection(url: string | null): void {
    if (!url) {
      this.closeConnection(new Error("WS proxy URL cleared"));
      this.sharedDevices$.next([]);
      return;
    }

    if (this.wsConnection && this.wsConnection.url === url) {
      return;
    }

    this.closeConnection(new Error("Switching WS proxy URL"));
    this.openConnection(url);
  }

  private ensureWsConnectionIfNeeded(trigger: string): void {
    const url = proxyUrl$.getValue();
    if (!url) {
      return;
    }

    const conn = this.wsConnection;
    if (!conn) {
      this.logger.info("Opening WebSocket connection on demand", {
        data: { trigger, url },
      });
      this.openConnection(url);
      return;
    }

    if (conn.url !== url) {
      this.logger.info("Recreating WebSocket due URL mismatch", {
        data: { trigger, currentUrl: conn.url, expectedUrl: url },
      });
      this.closeConnection(new Error("WS connection URL mismatch"));
      this.openConnection(url);
      return;
    }

    if (conn.ws.readyState === WebSocket.OPEN || conn.ws.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.logger.info("Reopening stale WebSocket connection", {
      data: { trigger, url, readyState: conn.ws.readyState },
    });
    this.closeConnection(new Error("Recovering stale WebSocket connection"));
    this.openConnection(url);
  }

  private openConnection(url: string): void {
    let ws: WebSocket;

    try {
      ws = new WebSocket(url);
    } catch (e) {
      this.logger.error("WebSocket constructor threw", {
        data: {
          url,
          error: e,
        },
      });
      return;
    }

    const devices$ = new BehaviorSubject<WsProxyDeviceInfo[]>([]);
    const connection: WsConnection = {
      ws,
      url,
      devices$,
    };
    this.wsConnection = connection;

    ws.onopen = () => {
      this.logger.info("WebSocket open", {
        data: {
          url,
        },
      });
    };

    ws.onmessage = (event: MessageEvent) => {
      const msg = parseServerMessage(event.data);
      if (!msg) {
        return;
      }
      this.logger.debug("WebSocket message", {
        data: {
          url,
          type: msg.type,
          discoveredDevicesCount:
            msg.type === "discovered-devices-updated" ? msg.discoveredDevices.length : undefined,
        },
      });
      this.handleMessage(connection, msg);
    };

    ws.onerror = event => {
      this.logger.error("WebSocket error", {
        data: {
          url,
          error: event,
        },
      });
      this.failConnectionsForSocket(connection.ws, new Error(`WebSocket error on ${url}`), true);
      devices$.next([]);
      this.refreshSharedDevices();
    };

    ws.onclose = event => {
      this.logger.info("WebSocket closed", {
        data: {
          url,
          code: event.code,
        },
      });
      this.failConnectionsForSocket(
        connection.ws,
        new Error(`WebSocket closed on ${url} (code=${event.code})`),
        true,
      );
      devices$.next([]);
      connection.devices$.complete();
      connection.devicesSubscription?.unsubscribe();
      if (this.wsConnection?.url === url) {
        this.wsConnection = null;
      }
      this.refreshSharedDevices();
    };

    const devicesSubscription = devices$.subscribe(() => this.refreshSharedDevices());
    connection.devicesSubscription = devicesSubscription;
  }

  private closeConnection(reason: Error): void {
    const conn = this.wsConnection;
    if (!conn) return;
    this.failConnectionsForSocket(conn.ws, reason, false);
    if (conn.ws.readyState === WebSocket.OPEN || conn.ws.readyState === WebSocket.CONNECTING) {
      conn.ws.close();
    }
    conn.devices$.complete();
    conn.devicesSubscription?.unsubscribe();
    this.wsConnection = null;
  }

  private failConnectionsForSocket(socket: WebSocket, error: Error, emitDisconnect: boolean): void {
    const deviceConnections = this.getDeviceConnectionsForSocket(socket);
    for (const deviceConnection of deviceConnections) {
      this.failDeviceConnection(deviceConnection, error, emitDisconnect);
    }
  }

  private refreshSharedDevices(): void {
    const all: TransportDiscoveredDevice[] = [];
    const conn = this.wsConnection;
    if (!conn) {
      this.sharedDevices$.next([]);
      return;
    }

    for (const dev of conn.devices$.getValue()) {
      all.push(this.toDiscoveredDevice(dev));
    }
    this.sharedDevices$.next(all);
  }

  private handleMessage(conn: WsConnection, msg: WsServerMessage): void {
    switch (msg.type) {
      case "discovered-devices-updated": {
        const previousIds = new Set(conn.devices$.getValue().map(device => device.id));
        conn.devices$.next(msg.discoveredDevices);
        const nextIds = new Set(msg.discoveredDevices.map(device => device.id));
        for (const previousId of previousIds) {
          if (!nextIds.has(previousId)) {
            this.handleDeviceDisconnected(previousId, true);
          }
        }
        break;
      }
      case "device-connected": {
        const deviceConnection = this.deviceConnectionsByDeviceId.get(msg.deviceId);
        deviceConnection?.resolveConnect(msg.requestId, {
          sessionId: msg.sessionId,
          deviceModel: msg.deviceModel,
        });
        break;
      }
      case "apdu-response": {
        const deviceConnection = this.deviceConnectionsByDeviceId.get(msg.deviceId);
        if (!deviceConnection) {
          this.logger.warn("Received APDU response for unknown device connection", {
            data: {
              deviceId: msg.deviceId,
              requestId: msg.requestId,
              responseHexLength: msg.data.length,
            },
          });
          break;
        }
        const resolved = deviceConnection.resolveApdu(msg.requestId, msg.data);
        if (!resolved) {
          this.logger.warn("Received APDU response for unknown request", {
            data: {
              deviceId: msg.deviceId,
              requestId: msg.requestId,
              responseHexLength: msg.data.length,
            },
          });
          break;
        }
        this.logger.debug("Received APDU response", {
          data: {
            deviceId: msg.deviceId,
            requestId: msg.requestId,
            responseHexLength: msg.data.length,
            responseHexPreview: toHexPreview(msg.data),
          },
        });
        break;
      }
      case "error": {
        this.logger.warn("Received proxy error message", {
          data: {
            deviceId: msg.deviceId,
            requestId: msg.requestId,
            message: msg.message,
          },
        });
        if (msg.deviceId) {
          const deviceConnection = this.deviceConnectionsByDeviceId.get(msg.deviceId);
          if (deviceConnection) {
            if (
              msg.requestId &&
              deviceConnection.rejectPendingRequest(msg.requestId, new Error(msg.message))
            ) {
              break;
            }
            this.failDeviceConnection(deviceConnection, new Error(msg.message), false);
            break;
          }
        }
        if (msg.requestId) {
          // fallback when deviceId is missing or no longer tracked
          for (const deviceConnection of this.getDeviceConnectionsForSocket(conn.ws)) {
            if (deviceConnection.rejectPendingRequest(msg.requestId, new Error(msg.message))) {
              return;
            }
          }
        }
        this.failConnectionsForSocket(conn.ws, new Error(msg.message), true);
        break;
      }
      case "device-disconnected":
        this.handleDeviceDisconnected(msg.deviceId, true);
        break;
    }
  }

  private toDiscoveredDevice(dev: WsProxyDeviceInfo): TransportDiscoveredDevice {
    const deviceModel = this.args.deviceModelDataSource.getDeviceModel({
      id: dev.deviceModel.id as DeviceModelId,
    });
    return {
      id: dev.id,
      deviceModel,
      transport: WS_PROXY_IDENTIFIER,
      name: dev.deviceModel.productName ?? deviceModel.productName,
    };
  }

  private getDeviceConnectionsForSocket(socket: WebSocket): WsProxyDeviceConnection[] {
    const deviceConnections: WsProxyDeviceConnection[] = [];
    for (const deviceConnection of this.deviceConnectionsByDeviceId.values()) {
      if (deviceConnection.socket === socket) {
        deviceConnections.push(deviceConnection);
      }
    }
    return deviceConnections;
  }

  private clearDeviceConnection(
    deviceConnection: WsProxyDeviceConnection,
    emitDisconnect: boolean,
  ): void {
    this.deviceConnectionsByDeviceId.delete(deviceConnection.deviceId);
    this.apduQueueByDeviceId.delete(deviceConnection.deviceId);
    if (emitDisconnect) {
      deviceConnection.emitDisconnect();
    }
    deviceConnection.setOnDisconnect(null);
  }

  private runApduRequestSerially<T>(deviceId: DeviceId, task: () => Promise<T>): Promise<T> {
    const queueTail = this.apduQueueByDeviceId.get(deviceId);
    const runTask = queueTail ? queueTail.catch(() => undefined).then(task) : task();
    this.apduQueueByDeviceId.set(
      deviceId,
      runTask.then(
        () => undefined,
        () => undefined,
      ),
    );
    return runTask;
  }

  private failDeviceConnection(
    deviceConnection: WsProxyDeviceConnection,
    error: Error,
    emitDisconnect: boolean,
  ): void {
    deviceConnection.rejectAllPending(error);
    this.clearDeviceConnection(deviceConnection, emitDisconnect);
  }

  private handleDeviceDisconnected(deviceId: DeviceId, emitDisconnect: boolean): void {
    const deviceConnection = this.deviceConnectionsByDeviceId.get(deviceId);
    if (!deviceConnection) return;
    this.failDeviceConnection(
      deviceConnection,
      new Error(`Device ${deviceId} disconnected`),
      emitDisconnect,
    );
  }

  private async sendApduOverWs(
    deviceConnection: WsProxyDeviceConnection,
    apdu: Uint8Array,
    abortTimeoutMs?: number,
  ): Promise<SendApduResult> {
    return this.runApduRequestSerially(deviceConnection.deviceId, async () => {
      if (deviceConnection.socket.readyState !== WebSocket.OPEN) {
        this.logger.warn("Cannot send APDU: WebSocket is not open", {
          data: {
            deviceId: deviceConnection.deviceId,
            socketReadyState: deviceConnection.socket.readyState,
            apduByteLength: apdu.length,
          },
        });
        return Left(new OpeningConnectionError(new Error("WebSocket not connected")));
      }

      let requestId: string | undefined;
      let hexData: string | undefined;
      try {
        hexData = encodeApdu(apdu);
        requestId = createRequestId("send-apdu");
        const apduRequestId = requestId;
        const apduHexData = hexData;
        this.logger.debug("Sending APDU over WebSocket", {
          data: {
            deviceId: deviceConnection.deviceId,
            requestId: apduRequestId,
            apduByteLength: apdu.length,
            apduHexPreview: toHexPreview(apduHexData),
            abortTimeoutMs,
          },
        });

        const responseHex = await new Promise<string>((resolve, reject) => {
          deviceConnection.addPendingApdu(apduRequestId, {
            resolve,
            reject,
          });

          try {
            deviceConnection.socket.send(
              JSON.stringify(
                createSendApduMessage(
                  deviceConnection.deviceId,
                  apduRequestId,
                  apduHexData,
                  abortTimeoutMs,
                ),
              ),
            );
            this.logger.debug(formatApduSentLog(apdu), {
              data: {
                deviceId: deviceConnection.deviceId,
                requestId: apduRequestId,
              },
            });
          } catch (sendError) {
            const error = sendError instanceof Error ? sendError : new Error(String(sendError));
            const didRejectPending = deviceConnection.rejectPendingRequest(apduRequestId, error);
            if (!didRejectPending) {
              reject(error);
            }
          }
        });

        this.logger.debug("Received APDU payload over WebSocket", {
          data: {
            deviceId: deviceConnection.deviceId,
            requestId: apduRequestId,
            responseHexLength: responseHex.length,
            responseHexPreview: toHexPreview(responseHex),
          },
        });
        const { data, statusCode } = decodeApduResponseHex(responseHex);
        const apduResponse = new ApduResponse({
          data,
          statusCode,
        });
        this.logger.debug(formatApduReceivedLog(apduResponse), {
          data: {
            deviceId: deviceConnection.deviceId,
            requestId: apduRequestId,
          },
        });
        this.logger.debug("Decoded APDU response", {
          data: {
            deviceId: deviceConnection.deviceId,
            requestId: apduRequestId,
            responseDataLength: data.length,
            statusCodeHex: encodeApdu(statusCode),
          },
        });

        return Right(apduResponse);
      } catch (err) {
        this.logger.error("sendApduOverWs failed", {
          data: {
            deviceId: deviceConnection.deviceId,
            requestId,
            apduByteLength: apdu.length,
            apduHexPreview: hexData ? toHexPreview(hexData) : undefined,
            abortTimeoutMs,
            ...toErrorLogData(err),
          },
        });
        return Left(new OpeningConnectionError(err));
      }
    });
  }
}

/**
 * Factory for the DMK builder. Always register — zero overhead when no URLs are configured.
 */
export const wsProxyTransportFactory: TransportFactory = (args: TransportArgs) =>
  new WsProxyTransport(args);
