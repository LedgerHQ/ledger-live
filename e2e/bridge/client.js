// @flow
import { Platform } from "react-native";
import invariant from "invariant";
import { Subject } from "rxjs/Subject";
import type { AccountRaw } from "@ledgerhq/live-common/lib/types";
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

export const e2eBridgeSubject = new Subject<E2EBridgeSubjectMessage>();

type Message<T: string, P = any> = {
  type: T,
  payload: P,
};

type E2EBridgeSubjectMessage =
  | Message<"add", { id: string, name: string }>
  | Message<"open", ?*>;

export type E2EBridgeMessage =
  | E2EBridgeSubjectMessage
  | Message<"setGlobals", { [key: string]: any }>
  | Message<"importAccounts", { data: AccountRaw, version: number }[]>
  | Message<"importSettngs", { [key: string]: any }>
  | Message<"acceptTerms", ?*>
  | Message<"navigate", string>;

function log(message: string) {
  // eslint-disable-next-line no-console
  console.log(`[E2E Bridge Client]: ${message}`);
}
