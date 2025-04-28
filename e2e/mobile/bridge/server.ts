import { Server } from "ws";
import path from "path";
import fs from "fs";
import net from "net";
import merge from "lodash/merge";

import { NavigatorName } from "~/const";
import { BleState, DeviceLike } from "~/reducers/types";
import { Account, AccountRaw } from "@ledgerhq/types-live";
import { DeviceUSB, nanoS_USB, nanoSP_USB, nanoX_USB } from "../models/devices";
import { MessageData, MockDeviceEvent, ServerData } from "./types";
import { getDeviceModel } from "@ledgerhq/devices";
import { SettingsSetOverriddenFeatureFlagsPlayload } from "~/actions/types";
import { log as detoxLog } from "detox";
import { execSync } from "child_process";

let clientResponse: (data: string) => void;
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
  const timestamp = Date.now().toString(36); // Convert timestamp to base36 string
  const randomString = Math.random().toString(36).slice(2, 7); // Generate random string
  return timestamp + randomString; // Concatenate timestamp and random string
}

export function init(port = 8099, onConnection?: () => void) {
  webSocket.wss = new Server({ port });
  webSocket.messages = {};
  log(`Start listening on localhost:${port}`);

  webSocket.wss.on("connection", ws => {
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
    webSocket.wss.clients.forEach(client => {
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

  const f = fs.readFileSync(path.resolve("userdata", `${fileName}.json`), "utf8");

  const { data } = JSON.parse(f.toString());

  const defaultSettings = { shareAnalytics: true, hasSeenAnalyticsOptInPrompt: true };
  const settings = merge(defaultSettings, data.settings || {});
  await postMessage({ type: "importSettings", id: uniqueId(), payload: settings });

  await navigate(NavigatorName.Base);

  if (data.accounts?.length) {
    await postMessage({ type: "importAccounts", id: uniqueId(), payload: data.accounts });
  }
}

export async function setFeatureFlags(flags: SettingsSetOverriddenFeatureFlagsPlayload) {
  await postMessage({ type: "overrideFeatureFlags", id: uniqueId(), payload: flags });
}

export async function loadBleState(bleState: BleState) {
  await postMessage({ type: "importBle", id: uniqueId(), payload: bleState });
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
  const modulePath = "@ledgerhq/live-common/account/index";
  delete require.cache[require.resolve(modulePath)];

  // Dynamically import fresh version of the module
  const { toAccountRaw } = await import(modulePath);
  await postMessage({
    type: "importAccounts",
    id: uniqueId(),
    payload: accounts.map(account => ({
      version: 1,
      data: toAccountRaw(account),
    })),
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
  devicesList.forEach(device => {
    postMessage({
      type: "add",
      id: uniqueId(),
      payload: {
        id: device.id,
        name: device.name,
        serviceUUID: getDeviceModel(device.modelId).bluetoothSpec![0].serviceUuid,
      },
    });
  });
}

export async function addDevicesUSB(
  devices: DeviceUSB | DeviceUSB[] = [nanoX_USB, nanoSP_USB, nanoS_USB],
): Promise<DeviceUSB[]> {
  const devicesArray = Array.isArray(devices) ? devices : [devices];
  for (const device of devicesArray) {
    await postMessage({ type: "addUSB", id: uniqueId(), payload: device });
  }
  return devicesArray;
}

export async function setInstalledApps(apps: string[] = []) {
  await postMessage({
    type: "setGlobals",
    id: uniqueId(),
    payload: { _listInstalledApps_mock_result: apps },
  });
}

export async function open() {
  await postMessage({ type: "open", id: uniqueId() });
}

export async function swapSetup() {
  await postMessage({ type: "swapSetup", id: uniqueId() });
}

export async function waitSwapReady() {
  return fetchData({ type: "waitSwapReady", id: uniqueId() }, RESPONSE_TIMEOUT * 3);
}

export async function getLogs() {
  return fetchData({ type: "getLogs", id: uniqueId() });
}

export async function getFlags() {
  return fetchData({ type: "getFlags", id: uniqueId() });
}

export async function getEnvs() {
  return fetchData({ type: "getEnvs", id: uniqueId() });
}

async function fetchData(message: MessageData, timeout = RESPONSE_TIMEOUT): Promise<string> {
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

export async function addKnownSpeculos(proxyAddress: string) {
  await postMessage({ type: "addKnownSpeculos", id: uniqueId(), payload: proxyAddress });
}

export async function removeKnownSpeculos(id: string) {
  await postMessage({ type: "removeKnownSpeculos", id: uniqueId(), payload: id });
}

export function killDockerSpeculos() {
  try {
    const output = execSync(
      `docker ps -a --format '{{.ID}} {{.Image}}' | grep ledgerhq/speculos || true`,
    )
      .toString()
      .trim();

    if (!output) {
      detoxLog.info("No Speculos containers found to remove.");
      return;
    }

    const containerIds = output
      .split("\n")
      .map(line => line.split(" ")[0])
      .filter(Boolean);

    if (containerIds.length > 0) {
      execSync(`docker rm -f ${containerIds.join(" ")}`);
      detoxLog.info(`Removed Speculos Docker containers: ${containerIds.join(", ")}`);
    }
  } catch (error) {
    detoxLog.error(`Failed to remove Speculos Docker container: ${error}`);
  }
}

function onMessage(messageStr: string) {
  const msg: ServerData = JSON.parse(messageStr);
  log(`Message received ${msg.type}`);

  switch (msg.type) {
    case "ACK":
      log(`${msg.id}`);
      delete webSocket.messages[msg.id];
      break;
    case "walletAPIResponse":
      webSocket.e2eBridgeServer.next(msg);
      break;
    case "appLogs": {
      clientResponse(msg.payload);
      break;
    }
    case "appFlags":
      clientResponse(msg.payload);
      break;
    case "appEnvs":
      clientResponse(msg.payload);
      break;
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
