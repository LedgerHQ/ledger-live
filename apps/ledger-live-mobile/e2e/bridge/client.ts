import { Platform } from "react-native";
import { DescriptorEventType } from "@ledgerhq/hw-transport";
import invariant from "invariant";
import { Subject, Observable } from "rxjs";
import { AccountRaw } from "@ledgerhq/types-live";
import { ConnectAppEvent } from "@ledgerhq/live-common/hw/connectApp";
import { Event as AppEvent } from "@ledgerhq/live-common/hw/actions/app";
import { ConnectManagerEvent } from "@ledgerhq/live-common/hw/connectManager";
import { store } from "../../src/context/LedgerStore";
import { importSettings } from "../../src/actions/settings";
import { importStore as importAccounts } from "../../src/actions/accounts";
import { acceptGeneralTerms } from "../../src/logic/terms";
import { navigate } from "../../src/rootnavigation";
import { BleState, SettingsState } from "../../src/reducers/types";
import { importBle } from "../../src/actions/ble";
import { InstallLanguageEvent } from "@ledgerhq/live-common/hw/installLanguage";
import { LoadImageEvent } from "@ledgerhq/live-common/hw/staxLoadImage";
import { SwapRequestEvent } from "@ledgerhq/live-common/exchange/swap/types";
import { FetchImageEvent } from "@ledgerhq/live-common/hw/staxFetchImage";
import { ExchangeRequestEvent } from "@ledgerhq/live-common/hw/actions/startExchange";
import { CompleteExchangeRequestEvent } from "@ledgerhq/live-common/exchange/platform/types";
import { RemoveImageEvent } from "@ledgerhq/live-common/hw/staxRemoveImage";
import { RenameDeviceEvent } from "@ledgerhq/live-common/hw/renameDevice";
import { LaunchArguments } from "react-native-launch-arguments";
import { DeviceEventEmitter } from "react-native";
import { DeviceUSB } from "../models/devices";

export type MockDeviceEvent =
  | ConnectAppEvent
  | AppEvent
  | ConnectManagerEvent
  | InstallLanguageEvent
  | LoadImageEvent
  | FetchImageEvent
  | ExchangeRequestEvent
  | SwapRequestEvent
  | RemoveImageEvent
  | RenameDeviceEvent
  | CompleteExchangeRequestEvent
  | { type: "complete" };

const mockDeviceEventSubject = new Subject<MockDeviceEvent>();

// these adaptor will filter the event type to satisfy typescript (workaround), it works because underlying exec usage will ignore unknown event type
export const connectAppExecMock = (): Observable<ConnectAppEvent> =>
  mockDeviceEventSubject as Observable<ConnectAppEvent>;
export const initSwapExecMock = (): Observable<SwapRequestEvent> =>
  mockDeviceEventSubject as Observable<SwapRequestEvent>;
export const startExchangeExecMock = (): Observable<ExchangeRequestEvent> =>
  mockDeviceEventSubject as Observable<ExchangeRequestEvent>;
export const connectManagerExecMock = (): Observable<ConnectManagerEvent> =>
  mockDeviceEventSubject as Observable<ConnectManagerEvent>;
export const staxFetchImageExecMock = (): Observable<FetchImageEvent> =>
  mockDeviceEventSubject as Observable<FetchImageEvent>;
export const staxLoadImageExecMock = (): Observable<LoadImageEvent> =>
  mockDeviceEventSubject as Observable<LoadImageEvent>;
export const staxRemoveImageExecMock = (): Observable<RemoveImageEvent> =>
  mockDeviceEventSubject as Observable<RemoveImageEvent>;
export const installLanguageExecMock = (): Observable<InstallLanguageEvent> =>
  mockDeviceEventSubject as Observable<InstallLanguageEvent>;
export const completeExchangeExecMock = (): Observable<CompleteExchangeRequestEvent> =>
  mockDeviceEventSubject as Observable<CompleteExchangeRequestEvent>;
export const renameDeviceExecMock = (): Observable<RenameDeviceEvent> =>
  mockDeviceEventSubject as Observable<RenameDeviceEvent>;

export type MessageData =
  | {
      type: DescriptorEventType;
      payload: { id: string; name: string; serviceUUID: string };
    }
  | { type: "open" }
  | {
      type: "mockDeviceEvent";
      payload: MockDeviceEvent[];
    }
  | { type: "acceptTerms" }
  | { type: "addUSB"; payload: DeviceUSB }
  | { type: "navigate"; payload: string }
  | { type: "importSettings"; payload: Partial<SettingsState> }
  | {
      type: "importAccounts";
      payload: {
        data: AccountRaw;
        version: number;
      }[];
    }
  | {
      type: "importBle";
      payload: BleState;
    }
  | {
      type: "setGlobals";
      payload: { [key: string]: unknown };
    };

export const e2eBridgeClient = new Subject<MessageData>();

let ws: WebSocket;

export function init() {
  let wsPort = LaunchArguments.value()["wsPort"] || "8099";

  if (ws) {
    ws.close();
  }

  const ipAddress = Platform.OS === "ios" ? "localhost" : "10.0.2.2";
  const path = `${ipAddress}:${wsPort}`;
  ws = new WebSocket(`ws://${path}`);
  ws.onopen = () => {
    log(`Connection opened on ${path}`);
  };

  ws.onmessage = onMessage;
}

function onMessage(event: WebSocketMessageEvent) {
  invariant(typeof event.data === "string", "[E2E Bridge Client]: Message data must be string");
  const msg: MessageData = JSON.parse(event.data);
  invariant(msg.type, "[E2E Bridge Client]: type is missing");

  log(`Message\n${JSON.stringify(msg, null, 2)}`);

  e2eBridgeClient.next(msg);

  switch (msg.type) {
    case "setGlobals":
      Object.entries(msg.payload).forEach(([k, v]) => {
        //  @ts-expect-error global bullshit
        global[k] = v;
      });
      break;
    case "acceptTerms":
      acceptGeneralTerms(store);
      break;
    case "importAccounts": {
      store.dispatch(importAccounts({ active: msg.payload }));
      break;
    }
    case "mockDeviceEvent": {
      msg.payload.forEach(e => mockDeviceEventSubject.next(e));
      break;
    }
    case "importSettings": {
      store.dispatch(importSettings(msg.payload));
      break;
    }
    case "importBle": {
      store.dispatch(importBle(msg.payload));
      break;
    }
    case "navigate":
      navigate(msg.payload, {});
      break;
    case "addUSB":
      DeviceEventEmitter.emit("onDeviceConnect", msg.payload);
    default:
      break;
  }
}

export function sendWalletAPIResponse(payload: Record<string, unknown>) {
  ws.send(
    JSON.stringify({
      type: "walletAPIResponse",
      payload,
    }),
  );
}

function log(message: string) {
  // eslint-disable-next-line no-console
  console.log(`[E2E Bridge Client]: ${message}`);
}
