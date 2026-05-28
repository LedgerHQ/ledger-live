/* eslint-disable no-var */
import type { Subject } from "rxjs";
import type { Server, WebSocket } from "ws";
import type { MessageData, ServerData } from "../../../apps/ledger-live-mobile/e2e/bridge/types";

declare global {
  var webSocket: {
    wss: Server | undefined;
    ws: WebSocket | undefined;
    messages: { [id: string]: MessageData };
    e2eBridgeServer: Subject<ServerData>;
  };

  var pendingCallbacks: Map<string, { callback: (data: string) => void }>;
}

export {};
