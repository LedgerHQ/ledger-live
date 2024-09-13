import { Server, WebSocket } from "ws";
import path from "path";
import fs from "fs";
import net from "net";
import { toAccountRaw } from "@ledgerhq/live-common/account/index";
import { NavigatorName } from "../../src/const";
import { Subject } from "rxjs";
import { BleState, DeviceLike } from "../../src/reducers/types";
import { Account, AccountRaw } from "@ledgerhq/types-live";
import { DeviceUSB, nanoSP_USB, nanoS_USB, nanoX_USB } from "../models/devices";
import { MessageData, MockDeviceEvent, ServerData } from "./types";
import { getDeviceModel } from "@ledgerhq/devices";

export const e2eBridgeServer = new Subject<ServerData>();

let wss: Server;
let webSocket: WebSocket;
const lastMessages: { [id: string]: MessageData } = {}; // Store the last messages not sent
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

  const f = fs.readFileSync(path.resolve("e2e", "userdata", `${fileName}.json`), "utf8");

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

export async function getLogs() {
  return fetchData({ type: "getLogs", id: uniqueId() });
}

export async function getFlags() {
  return fetchData({ type: "getFlags", id: uniqueId() });
}

export async function getEnvs() {
  return fetchData({ type: "getEnvs", id: uniqueId() });
}

function fetchData(message: MessageData): Promise<string> {
  return new Promise<string>(resolve => {
    postMessage(message);
    const timeoutId = setTimeout(() => {
      console.warn(`Timeout while waiting for ${message.type}`);
      resolve("");
    }, RESPONSE_TIMEOUT);

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
