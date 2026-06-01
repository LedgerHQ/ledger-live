import { Subject } from "rxjs";
import { ServerData } from "../../../apps/ledger-live-mobile/e2e/bridge/types";

// Seeds the globals the reused e2e/mobile bridge server expects (the WebSocket
// holder and the pending-callback map). Must run before the bridge starts.
// Ambient types live in types/global.d.ts.
export function initBridgeGlobals() {
  global.webSocket = {
    wss: undefined,
    ws: undefined,
    messages: {},
    e2eBridgeServer: new Subject<ServerData>(),
  };
  global.pendingCallbacks = new Map();
}
