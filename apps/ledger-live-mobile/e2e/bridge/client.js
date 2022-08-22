import { Platform } from "react-native";
import invariant from "invariant";
import { Subject } from "rxjs/Subject";
import type { AccountRaw } from "@ledgerhq/types-live";
import { store } from "../../src/context/LedgerStore";
import { importSettings } from "../../src/actions/settings";
import { setAccounts } from "../../src/actions/accounts";
import { acceptTerms } from "../../src/logic/terms";
import accountModel from "../../src/logic/accountModel";
import { navigate } from "../../src/rootnavigation";

let ws: WebSocket;

export function init(port: number = 8099) {
  const ipAddress = Platform.OS === "ios" ? "localhost" : "10.0.2.2";
  const path = `${ipAddress}:${port}`;
  ws = new WebSocket(`ws://${path}`);
  ws.onopen = () => {
    log(`Connection opened on ${path}`);
  };

  ws.onmessage = onMessage;
}

async function onMessage(event: { data: mixed }) {
  invariant(
    typeof event.data === "string",
    "[E2E Bridge Client]: Message data must be string",
  );
  const msg: E2EBridgeMessage = JSON.parse(event.data);
  invariant(msg.type, "[E2E Bridge Client]: type is missing");

  log(`Message\n${JSON.stringify(msg, null, 2)}`);

  switch (msg.type) {
    case "add":
    case "open":
      e2eBridgeSubject.next(msg);
      break;
    case "setGlobals":
      Object.entries(msg.payload).forEach(([k, v]) => {
        global[k] = v;
      });
      break;
    case "acceptTerms":
      acceptTerms();
      break;
    case "importAccounts": {
      store.dispatch(setAccounts(msg.payload.map(accountModel.decode)));
      break;
    }
    case "importSettngs": {
      store.dispatch(importSettings(msg.payload));
      break;
    }
    case "navigate":
      navigate(msg.payload);
      break;
    default:
      break;
  }
}

export const e2eBridgeSubject = new Subject();

function log(message: string) {
  // eslint-disable-next-line no-console
  console.log(`[E2E Bridge Client]: ${message}`);
}
