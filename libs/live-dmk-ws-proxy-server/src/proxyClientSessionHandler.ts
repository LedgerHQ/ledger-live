import WebSocket from "ws";
import {
  DeviceStatus,
  formatApduReceivedLog,
  formatApduSentLog,
  type DeviceManagementKit,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import type { Subscription } from "rxjs";
import { log } from "@ledgerhq/logs";
import type { WsServerMessage } from "@ledgerhq/live-dmk-ws-proxy-shared";
import { mapDiscoveredDeviceToWsProxyDeviceInfo } from "./messaging";

type SendToClient = (ws: WebSocket, msg: WsServerMessage) => boolean;
type ClientSessionState = {
  sessionId: string;
  sessionStateSubscription: Subscription | null;
};

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

const toErrorDetails = (error: unknown): string => {
  const message = toErrorMessage(error);
  if (error && typeof error === "object" && "_tag" in error && typeof error._tag === "string") {
    return `${error._tag}: ${message}`;
  }
  return message;
};

const isValidApduHex = (apduHex: string): boolean =>
  apduHex.length % 2 === 0 && /^[\da-f]*$/i.test(apduHex);

/**
 * Handles proxy protocol commands (`connect`, `send-apdu`, `disconnect`) for one WS client.
 *
 * It owns the DMK session lifecycle for that client's devices and maps DMK
 * outcomes to WS server messages.
 *
 * Socket connection lifecycle, startup/teardown orchestration, and discovery
 * broadcasting are intentionally handled by other modules.
 */
export class ProxyClientSessionHandler {
  private sessionsByDeviceId = new Map<string, ClientSessionState>();

  constructor(
    private readonly dmk: DeviceManagementKit,
    private readonly getDiscoveredDevices: () => DiscoveredDevice[],
    private readonly ws: WebSocket,
    private readonly sendToClient: SendToClient,
  ) {}

  private closeSession = async (deviceId: string): Promise<void> => {
    const session = this.sessionsByDeviceId.get(deviceId);
    if (!session) return;
    session.sessionStateSubscription?.unsubscribe();

    try {
      await this.dmk.disconnect({ sessionId: session.sessionId });
      log("proxy", `Disconnected session ${session.sessionId} for ${deviceId}`);
    } catch {
      // session might already be gone
    }
    this.sessionsByDeviceId.delete(deviceId);
  };

  private subscribeToDeviceSessionState = (deviceId: string, sessionId: string): void => {
    const subscription = this.dmk.getDeviceSessionState({ sessionId }).subscribe({
      next: state => {
        if (state.deviceStatus !== DeviceStatus.NOT_CONNECTED) return;
        const session = this.sessionsByDeviceId.get(deviceId);
        if (!session || session.sessionId !== sessionId) return;
        session.sessionStateSubscription?.unsubscribe();
        this.sessionsByDeviceId.delete(deviceId);
        this.sendToClient(this.ws, { type: "device-disconnected", deviceId });
        log("proxy", `Session ${sessionId} for ${deviceId} moved to NOT_CONNECTED`);
      },
      error: () => {
        const session = this.sessionsByDeviceId.get(deviceId);
        if (!session || session.sessionId !== sessionId) return;
        session.sessionStateSubscription?.unsubscribe();
        this.sessionsByDeviceId.delete(deviceId);
        this.sendToClient(this.ws, { type: "device-disconnected", deviceId });
        log("proxy", `Session state stream errored for ${deviceId} (${sessionId})`);
      },
    });

    const session = this.sessionsByDeviceId.get(deviceId);
    if (!session || session.sessionId !== sessionId) {
      subscription.unsubscribe();
      return;
    }
    session.sessionStateSubscription = subscription;
  };

  handleConnect = async (deviceId: string, requestId: string): Promise<void> => {
    const existingSession = this.sessionsByDeviceId.get(deviceId);
    if (existingSession) {
      const existingDevice = this.getDiscoveredDevices().find(d => d.id === deviceId);
      this.sendToClient(this.ws, {
        type: "device-connected",
        requestId,
        deviceId,
        sessionId: existingSession.sessionId,
        deviceModel: existingDevice
          ? mapDiscoveredDeviceToWsProxyDeviceInfo(existingDevice).deviceModel
          : { id: "nanoX", productName: "Ledger Device" },
      });
      return;
    }

    const device = this.getDiscoveredDevices().find(d => d.id === deviceId);
    if (!device) {
      this.sendToClient(this.ws, {
        type: "error",
        requestId,
        deviceId,
        message: `Device ${deviceId} not found`,
      });
      return;
    }

    try {
      log("proxy", `Opening connection to device ${deviceId}...`);
      const sessionId = await this.dmk.connect({
        device,
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
      this.sessionsByDeviceId.set(deviceId, {
        sessionId,
        sessionStateSubscription: null,
      });
      this.subscribeToDeviceSessionState(deviceId, sessionId);
      log("proxy", `Connected to device ${deviceId}, sessionId: ${sessionId}`);

      this.sendToClient(this.ws, {
        type: "device-connected",
        requestId,
        deviceId,
        sessionId,
        deviceModel: mapDiscoveredDeviceToWsProxyDeviceInfo(device).deviceModel,
      });
    } catch (error) {
      const errMsg = toErrorMessage(error);
      log("proxy", `Open error: ${errMsg}`);
      this.sendToClient(this.ws, { type: "error", requestId, deviceId, message: errMsg });
    }
  };

  handleSendApdu = async (
    deviceId: string,
    requestId: string,
    apduHex: string,
    abortTimeoutMs?: number,
  ): Promise<void> => {
    log(
      "proxy",
      `WS APDU request(deviceId=${deviceId}, requestId=${requestId}, abortTimeoutMs=${abortTimeoutMs ?? "none"})`,
    );
    const session = this.sessionsByDeviceId.get(deviceId);
    if (!session) {
      log(
        "proxy",
        `WS APDU rejected(deviceId=${deviceId}, requestId=${requestId}): no active session`,
      );
      this.sendToClient(this.ws, {
        type: "error",
        requestId,
        deviceId,
        message: "No active session",
      });
      return;
    }

    if (!isValidApduHex(apduHex)) {
      log(
        "proxy",
        `WS APDU rejected(deviceId=${deviceId}, requestId=${requestId}): invalid APDU hex payload`,
      );
      this.sendToClient(this.ws, {
        type: "error",
        requestId,
        deviceId,
        message: "Invalid APDU hex payload",
      });
      return;
    }

    try {
      const apduBytes = new Uint8Array((apduHex.match(/.{1,2}/g) ?? []).map(b => parseInt(b, 16)));
      log("proxy", `WS(${deviceId}) ${formatApduSentLog(apduBytes)}`);
      const result = await this.dmk.sendApdu({
        sessionId: session.sessionId,
        apdu: apduBytes,
        ...(typeof abortTimeoutMs === "number" ? { abortTimeout: abortTimeoutMs } : {}),
      });
      log("proxy", `WS(${deviceId}) ${formatApduReceivedLog(result)}`);

      const responseHex = Buffer.from([...result.data, ...result.statusCode]).toString("hex");
      this.sendToClient(this.ws, { type: "apdu-response", requestId, deviceId, data: responseHex });
    } catch (error) {
      const errMsg = toErrorDetails(error);
      log(
        "proxy",
        `WS APDU error(deviceId=${deviceId}, requestId=${requestId}, sessionId=${session.sessionId}): ${errMsg}`,
      );
      this.sendToClient(this.ws, { type: "error", requestId, deviceId, message: errMsg });
    }
  };

  handleDisconnect = async (deviceId?: string): Promise<void> => {
    if (deviceId) {
      await this.closeSession(deviceId);
      return;
    }

    await Promise.all(
      Array.from(this.sessionsByDeviceId.keys()).map(connectedDeviceId =>
        this.closeSession(connectedDeviceId),
      ),
    );
  };
}
