import type { DeviceId, DisconnectHandler } from "@ledgerhq/device-management-kit";

export class WsProxyDeviceConnection {
  private onDisconnect: DisconnectHandler | null = null;
  private pendingConnectRequest: {
    requestId: string;
    resolve: (msg: { sessionId: string; deviceModel: { id: string; productName: string } }) => void;
    reject: (err: Error) => void;
  } | null = null;
  private pendingApduRequest: {
    requestId: string;
    resolve: (data: string) => void;
    reject: (err: Error) => void;
  } | null = null;

  constructor(
    readonly deviceId: DeviceId,
    readonly socket: WebSocket,
  ) {}

  setOnDisconnect(onDisconnect: DisconnectHandler | null): void {
    this.onDisconnect = onDisconnect;
  }

  addPendingConnect(
    requestId: string,
    pending: {
      resolve: (msg: {
        sessionId: string;
        deviceModel: { id: string; productName: string };
      }) => void;
      reject: (err: Error) => void;
    },
  ): void {
    if (this.pendingConnectRequest) {
      throw new Error(
        `Concurrent connect request is not supported for ${this.deviceId}. Pending request: ${this.pendingConnectRequest.requestId}`,
      );
    }
    this.pendingConnectRequest = { requestId, ...pending };
  }

  addPendingApdu(
    requestId: string,
    pending: {
      resolve: (data: string) => void;
      reject: (err: Error) => void;
    },
  ): void {
    if (this.pendingApduRequest) {
      throw new Error(
        `Concurrent APDU request is not supported for ${this.deviceId}. Pending request: ${this.pendingApduRequest.requestId}`,
      );
    }
    this.pendingApduRequest = { requestId, ...pending };
  }

  resolveConnect(
    requestId: string,
    msg: { sessionId: string; deviceModel: { id: string; productName: string } },
  ): boolean {
    const pending = this.pendingConnectRequest;
    if (!pending || pending.requestId !== requestId) return false;
    this.pendingConnectRequest = null;
    pending.resolve(msg);
    return true;
  }

  resolveApdu(requestId: string, data: string): boolean {
    const pending = this.pendingApduRequest;
    if (!pending || pending.requestId !== requestId) return false;
    this.pendingApduRequest = null;
    pending.resolve(data);
    return true;
  }

  rejectPendingRequest(requestId: string, error: Error): boolean {
    const pendingConnect = this.pendingConnectRequest;
    if (pendingConnect && pendingConnect.requestId === requestId) {
      this.pendingConnectRequest = null;
      pendingConnect.reject(error);
      return true;
    }
    const pendingApdu = this.pendingApduRequest;
    if (pendingApdu && pendingApdu.requestId === requestId) {
      this.pendingApduRequest = null;
      pendingApdu.reject(error);
      return true;
    }
    return false;
  }

  rejectAllPending(error: Error): void {
    if (this.pendingConnectRequest) {
      this.pendingConnectRequest.reject(error);
      this.pendingConnectRequest = null;
    }

    if (this.pendingApduRequest) {
      this.pendingApduRequest.reject(error);
      this.pendingApduRequest = null;
    }
  }

  emitDisconnect(): void {
    if (this.onDisconnect) {
      this.onDisconnect(this.deviceId);
    }
  }
}
