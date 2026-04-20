import WebSocket from "ws";
import path from "path";
import fs from "fs";
import net from "net";
import merge from "lodash/merge";

import { NavigatorName } from "../../src/const";
import { BleState, DeviceLike } from "../../src/reducers/types";
import { Account, AccountRaw } from "@ledgerhq/types-live";
import { DeviceUSB, nanoSP_USB, nanoS_USB, nanoX_USB } from "../models/devices";
import { MessageData, MockDeviceEvent, ServerData } from "./types";
import { getDeviceModel } from "@ledgerhq/devices";
import { log as detoxLog } from "detox";
import type { PartialFeatures, FeatureId, Feature } from "@shared/feature-flags";
import { FeatureIdSchema } from "@shared/feature-flags";
import { v4 as uuid } from "uuid";

type OverrideFeatureFlagPayload = { id: FeatureId; value: Feature | undefined };

let clientResponse: (data: string) => void;
type PendingAck = {
  resolve: () => void;
  timeoutId: ReturnType<typeof setTimeout>;
};
const pendingAcks = new Map<string, PendingAck>();
const RESPONSE_TIMEOUT = 10000;

export async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer({ allowHalfOpen: false });

    server.on("listening", () => {
      const address = server.address();
      if (address && typeof address !== "string") {
        const port: number = address.port;
        server.close(() => {
          resolve(port); // Resolve with the free port
        });
      } else {
        console.warn("Unable to determine port. Selecting default");
        resolve(8099); // Resolve with the free port
      }
    });

    server.on("error", err => {
      reject(err); // Reject with the error
    });

    server.listen(0); // Let the system choose an available port
  });
}

function uniqueId(): string {
  return uuid();
}

function isFeatureId(key: string): key is FeatureId {
  return FeatureIdSchema.safeParse(key).success;
}

export function init(port = 8099, onConnection?: () => void) {
  webSocket.wss = new WebSocket.Server({ port });
  webSocket.messages = {};
  log(`Start listening on localhost:${port}`);

  webSocket.wss.on("connection", (ws: WebSocket) => {
    log(`Client connected`);
    onConnection && onConnection();
    webSocket.ws?.close();
    webSocket.ws = ws;
    ws.on("message", onMessage);
    ws.on("close", () => {
      log("Client disconnected");
      webSocket.ws = undefined;
    });
    if (Object.keys(webSocket.messages).length !== 0) {
      log(`Sending unsent messages`);
      Object.values(webSocket.messages).forEach(message => {
        postMessage(message);
      });
    }
  });
}

export function close() {
  if (webSocket.ws) {
    webSocket.ws.removeAllListeners();
    webSocket.ws.close();
    webSocket.ws = undefined;
  }

  if (webSocket.wss) {
    webSocket.wss.clients.forEach((client: WebSocket) => {
      client.removeAllListeners();
      client.terminate();
    });

    webSocket.wss.close(() => {
      webSocket.wss = undefined;
    });
  }
  webSocket.messages = {};
}

export async function loadConfig(fileName: string, agreed: true = true): Promise<void> {
  if (agreed) {
    await acceptTerms();
  }

  const f = fs.readFileSync(path.resolve("e2e", "userdata", `${fileName}.json`), "utf8");

  const { data } = JSON.parse(f.toString());

  const defaultSettings = { shareAnalytics: true, hasSeenAnalyticsOptInPrompt: true };
  const settings = merge(defaultSettings, data.settings || {});
  await postMessage({ type: "importSettings", id: uniqueId(), payload: settings });

  navigate(NavigatorName.Base);

  if (data.accounts?.length) {
    await postMessage({ type: "importAccounts", id: uniqueId(), payload: data.accounts });
  }

  if (data.featureFlags?.overrides) {
    await setFeatureFlags(data.featureFlags.overrides);
  }
}

export async function loadBleState(bleState: BleState) {
  await postMessageAndWaitForAck({ type: "importBle", id: uniqueId(), payload: bleState });
}

export async function loadAccountsRaw(
  payload: {
    data: AccountRaw;
    version: number;
  }[],
) {
  await postMessage({
    type: "importAccounts",
    id: uniqueId(),
    payload,
  });
}

export async function loadAccounts(accounts: Account[]) {
  delete require.cache[require.resolve("@ledgerhq/live-common/account/index")]; // Clear cache
  const toAccountRaw = require("@ledgerhq/live-common/account/index").toAccountRaw;
  await postMessage({
    type: "importAccounts",
    id: uniqueId(),
    payload: await Promise.all(
      accounts.map(async account => ({
        version: 1,
        data: await toAccountRaw(account),
      })),
    ),
  });
}

async function navigate(name: string) {
  await postMessage({
    type: "navigate",
    id: uniqueId(),
    payload: name,
  });
}

export async function mockDeviceEvent(...args: MockDeviceEvent[]) {
  await postMessage({
    type: "mockDeviceEvent",
    id: uniqueId(),
    payload: args,
  });
}

export async function addDevicesBT(devices: DeviceLike | DeviceLike[]) {
  const devicesList = Array.isArray(devices) ? devices : [devices];
  for (const device of devicesList) {
    await postMessageAndWaitForAck({
      type: "add",
      id: uniqueId(),
      payload: {
        id: device.id,
        name: device.name,
        serviceUUID: getDeviceModel(device.modelId).bluetoothSpec![0].serviceUuid,
      },
    });
  }
}

export async function addDevicesUSB(
  devices: DeviceUSB | DeviceUSB[] = [nanoX_USB, nanoSP_USB, nanoS_USB],
): Promise<DeviceUSB[]> {
  const devicesArray = Array.isArray(devices) ? devices : [devices];
  devicesArray.forEach(async device => {
    await postMessage({ type: "addUSB", id: uniqueId(), payload: device });
  });
  return devicesArray;
}

export async function open() {
  await postMessage({ type: "open", id: uniqueId() });
}

export async function getLogs() {
  return fetchData({ type: "getLogs", id: uniqueId() });
}

export async function setFeatureFlags(flags: PartialFeatures) {
  for (const id in flags) {
    if (isFeatureId(id)) {
      await setFeatureFlag({ id, value: flags[id] });
    }
  }
}

export async function setFeatureFlag(flag: OverrideFeatureFlagPayload) {
  postMessage({ type: "overrideFeatureFlag", id: uniqueId(), payload: flag });
}

function fetchData(message: MessageData, timeout = RESPONSE_TIMEOUT): Promise<string> {
  return new Promise<string>(resolve => {
    postMessage(message);
    const timeoutId = setTimeout(() => {
      console.warn(`Timeout while waiting for ${message.type}`);
      resolve("");
    }, timeout);

    clientResponse = (data: string) => {
      clearTimeout(timeoutId);
      resolve(data);
    };
  });
}

function postMessageAndWaitForAck(message: MessageData, timeout = RESPONSE_TIMEOUT): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      pendingAcks.delete(message.id);
      reject(new Error(`Timeout while waiting for ACK for ${message.type} (${message.id})`));
    }, timeout);

    pendingAcks.set(message.id, {
      resolve,
      timeoutId,
    });

    postMessage(message);
  });
}

function onMessage(messageStr: string) {
  const msg: ServerData = JSON.parse(messageStr);
  log(`Message received ${msg.type}`);

  switch (msg.type) {
    case "ACK":
      log(`${msg.id}`);
      delete webSocket.messages[msg.id];
      {
        const pendingAck = pendingAcks.get(msg.id);
        if (pendingAck) {
          clearTimeout(pendingAck.timeoutId);
          pendingAcks.delete(msg.id);
          pendingAck.resolve();
        }
      }
      break;
    case "walletAPIResponse":
      webSocket.e2eBridgeServer.next(msg);
      break;
    case "appLogs": {
      clientResponse(msg.payload);
      break;
    }
    default:
      break;
  }
}

function log(message: string) {
  detoxLog.info(`[E2E Bridge Server]: ${message}`);
}

async function acceptTerms() {
  await postMessage({ type: "acceptTerms", id: uniqueId() });
}

async function postMessage(message: MessageData) {
  log(`Message sending ${message.type}: ${message.id}`);
  try {
    webSocket.messages[message.id] = message;
    if (webSocket.ws) {
      webSocket.ws.send(JSON.stringify(message));
    } else {
      log("WebSocket connection is not open. Message not sent.");
    }
  } catch (error: unknown) {
    log(`Error occurred while waiting for WebSocket connection: ${JSON.stringify(error)}`);
  }
}
