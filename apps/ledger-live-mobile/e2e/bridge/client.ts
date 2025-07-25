import { Platform } from "react-native";
import invariant from "invariant";
import { Subject } from "rxjs";
import { store } from "~/context/store";
import {
  importSettings,
  setLastConnectedDevice,
  setOverriddenFeatureFlags,
} from "~/actions/settings";
import { importStore as importAccountsRaw } from "~/actions/accounts";
import { acceptGeneralTerms } from "~/logic/terms";
import { navigate } from "~/rootnavigation";
import { addKnownDevice, importBle, removeKnownDevice } from "~/actions/ble";
import { LaunchArguments } from "react-native-launch-arguments";
import { DeviceEventEmitter } from "react-native";
import logReport from "../../src/log-report";
import { MessageData, ServerData, mockDeviceEventSubject } from "./types";
import { getAllEnvs, setEnv } from "@ledgerhq/live-env";
import { getAllFeatureFlags } from "@ledgerhq/live-common/e2e/index";
import Config from "react-native-config";
import { SettingsSetOverriddenFeatureFlagsPlayload } from "~/actions/types";

export const e2eBridgeClient = new Subject<MessageData>();

let ws: WebSocket;
let retryCount = 0;
const maxRetries = 5; // Maximum number of retry attempts
const retryDelay = 500; // Initial retry delay in milliseconds

export function init() {
  const wsPort = LaunchArguments.value()["wsPort"] || "8099";
  const mock = LaunchArguments.value()["mock"];
  const disable_broadcast = LaunchArguments.value()["disable_broadcast"];

  log(`[E2E Bridge Client]: wsPort=${wsPort}, mock=${mock}`);

  if (mock == "0") {
    setEnv("MOCK", "");
    setEnv("MOCK_COUNTERVALUES", "");
    Config.MOCK = "";
  }
  setEnv("DISABLE_TRANSACTION_BROADCAST", disable_broadcast != "0");

  if (ws) {
    ws.close();
  }

  const ipAddress = Platform.OS === "ios" ? "localhost" : "10.0.2.2";
  const path = `${ipAddress}:${wsPort}`;
  ws = new WebSocket(`ws://${path}`);

  ws.onopen = () => {
    log(`Connection opened on ${path}`);
    retryCount = 0; // Reset retry count on successful connection
  };

  ws.onerror = error => {
    log(`WebSocket error: ${JSON.stringify(error)}`);
    if (retryCount < maxRetries) {
      retryCount++;
      const retryTimeout = retryDelay * Math.pow(2, retryCount);
      log(`Retrying connection in ${retryTimeout}ms (attempt ${retryCount} of ${maxRetries})`);
      setTimeout(init, retryTimeout);
    } else {
      log(`Max retries (${maxRetries}) reached. Cannot establish WebSocket connection.`);
    }
  };

  ws.onmessage = onMessage;
}

function onMessage(event: WebSocketMessageEvent) {
  try {
    invariant(typeof event.data === "string", "[E2E Bridge Client]: Message data must be string");
    const msg: MessageData = JSON.parse(event.data);
    invariant(msg.type, "[E2E Bridge Client]: type is missing");

    log(`Message recieved\n${JSON.stringify(msg, null, 2)}`);

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
        store.dispatch(importAccountsRaw({ active: msg.payload }));
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
      case "overrideFeatureFlags": {
        store.dispatch(
          setOverriddenFeatureFlags(msg.payload as SettingsSetOverriddenFeatureFlagsPlayload),
        );
        break;
      }
      case "navigate":
        navigate(msg.payload, {});
        break;
      case "addUSB":
        DeviceEventEmitter.emit("onDeviceConnect", msg.payload);
        break;
      case "getLogs": {
        const payload = JSON.stringify(logReport.getLogs());
        postMessage({
          type: "appLogs",
          payload,
        });
        break;
      }
      case "getFlags": {
        const payload = JSON.stringify(getAllFeatureFlags("en"));
        postMessage({
          type: "appFlags",
          payload,
        });
        break;
      }
      case "getEnvs": {
        const payload = JSON.stringify(getAllEnvs());
        postMessage({
          type: "appEnvs",
          payload,
        });
        break;
      }
      case "addKnownSpeculos": {
        const { address, model } = JSON.parse(msg.payload);
        store.dispatch(
          setLastConnectedDevice({
            deviceId: `httpdebug|ws://${address}`,
            deviceName: `${address}`,
            wired: false,
            modelId: model,
          }),
        );
        store.dispatch(
          addKnownDevice({
            id: `httpdebug|ws://${address}`,
            name: `${address}`,
            modelId: model,
          }),
        );
        setEnv("DEVICE_PROXY_URL", address);
        break;
      }
      case "removeKnownSpeculos": {
        const address = msg.payload;
        store.dispatch(removeKnownDevice(`httpdebug|ws://${address}`));
        setEnv("DEVICE_PROXY_URL", "");
        break;
      }
      case "swapSetup":
        setEnv("SWAP_DISABLE_APPS_INSTALL", true);
        setEnv("SWAP_API_BASE", "https://swap-stg.ledger-test.com/v5");
        break;
      default:
        break;
    }
    postMessage({ type: "ACK", id: msg.id });
  } catch (error) {
    log(`Error processing message: ${error}`);
  }
}

export function sendWalletAPIResponse(payload: Record<string, unknown>) {
  postMessage({
    type: "walletAPIResponse",
    payload,
  });
}

export function sendFile(payload: { fileName: string; fileContent: string }) {
  postMessage({
    type: "appFile",
    payload: JSON.stringify(payload),
  });
}

export function sendSwapLiveAppReady() {
  postMessage({
    type: "swapLiveAppReady",
  });
}

export function sendEarnLiveAppReady() {
  postMessage({
    type: "earnLiveAppReady",
  });
}

async function postMessage(message: ServerData) {
  log(`Message sending\n${JSON.stringify(message, null, 2)}`);
  try {
    if (ws) {
      ws.send(JSON.stringify(message));
    } else {
      log("WebSocket connection is not open. Message not sent.");
    }
  } catch (error: unknown) {
    log(`Error occurred while waiting for WebSocket connection: ${JSON.stringify(error)}`);
  }
}

function log(message: string) {
  // eslint-disable-next-line no-console
  console.log(`[E2E Bridge Client]: ${message}`);
}
