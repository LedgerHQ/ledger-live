import { Server, WebSocket } from "ws";
import path from "path";
import fs from "fs";
import { toAccountRaw } from "@ledgerhq/live-common/account/index";
import { NavigatorName } from "../../src/const";
import { Subject } from "rxjs";
import { BleState } from "../../src/reducers/types";
import { Account, AccountRaw } from "@ledgerhq/types-live";
import { DeviceUSB, nanoSP_USB, nanoS_USB, nanoX_USB } from "../models/devices";
import { MessageData, MockDeviceEvent, ServerData } from "./types";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";

export const e2eBridgeServer = new Subject<ServerData>();

let wss: Server;
let webSocket: WebSocket;
const lastMessages: { [id: string]: MessageData } = {}; // Store the last messages not sent

function uniqueId(): string {
  const timestamp = Date.now().toString(36); // Convert timestamp to base36 string
  const randomString = Math.random().toString(36).slice(2, 7); // Generate random string
  return timestamp + randomString; // Concatenate timestamp and random string
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function init(port = 8099, onConnection = () => {}) {
  wss = new Server({ port });
  log(`Start listening on localhost:${port}`);

  wss.on("connection", ws => {
    log(`Client connected`);
    onConnection();
    webSocket = ws;
    ws.on("message", onMessage);
    if (Object.keys(lastMessages).length !== 0) {
      log(`Sending unsent messages`);
      Object.values(lastMessages).forEach(message => {
        postMessage(message);
      });
    }
  });
}

export function close() {
  webSocket?.close();
  wss?.close();
}

export async function loadConfig(fileName: string, agreed: true = true): Promise<void> {
  if (agreed) {
    await acceptTerms();
  }

  const f = fs.readFileSync(path.resolve("e2e", "setups", `${fileName}.json`), "utf8");

  const { data } = JSON.parse(f.toString());

  await postMessage({ type: "importSettings", id: uniqueId(), payload: data.settings });

  navigate(NavigatorName.Base);

  if (data.accounts.length) {
    await postMessage({ type: "importAccounts", id: uniqueId(), payload: data.accounts });
  }
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

export async function addDevicesBT(
  deviceNames: string | string[] = [
    "Nano X de David",
    "Nano X de Arnaud",
    "Nano X de Didier Duchmol",
  ],
): Promise<string[]> {
  const names = Array.isArray(deviceNames) ? deviceNames : [deviceNames];
  const serviceUUID = getDeviceModel(DeviceModelId.nanoX).bluetoothSpec![0].serviceUuid;
  names.forEach((name, i) => {
    postMessage({
      type: "add",
      id: uniqueId(),
      payload: { id: `mock_${i + 1}`, name, serviceUUID },
    });
  });
  return names;
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

export async function getLogs(fileName: string) {
  await postMessage({ type: "getLogs", id: uniqueId(), fileName: fileName });
}

function onMessage(messageStr: string) {
  const msg: ServerData = JSON.parse(messageStr);
  log(`Message received ${msg.type}`);

  switch (msg.type) {
    case "ACK":
      log(`${msg.id}`);
      delete lastMessages[msg.id];
      break;
    case "walletAPIResponse":
      e2eBridgeServer.next(msg);
      break;
    case "appLogs": {
      const [date, time] = new Date().toISOString().split(".")[0].replace(/:/g, "-").split("T");
      const fileName = `${date}_${time}-${msg.fileName}.json`;
      const directoryPath = `artifacts/${date}_ledger_live_mobile`;
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }
      fs.writeFileSync(`${directoryPath}/${fileName}`, msg.payload, "utf-8");
      break;
    }
    default:
      break;
  }
}

function log(message: string) {
  // eslint-disable-next-line no-console
  console.log(`[E2E Bridge Server]: ${message}`);
}

async function acceptTerms() {
  await postMessage({ type: "acceptTerms", id: uniqueId() });
}

async function postMessage(message: MessageData) {
  log(`Message sending ${message.type}: ${message.id}`);
  try {
    lastMessages[message.id] = message;
    if (webSocket) {
      webSocket.send(JSON.stringify(message));
    } else {
      log("WebSocket connection is not open. Message not sent.");
    }
  } catch (error: unknown) {
    log(`Error occurred while waiting for WebSocket connection: ${JSON.stringify(error)}`);
  }
}
