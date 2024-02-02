import { Server, WebSocket } from "ws";
import path from "path";
import fs from "fs";
import { toAccountRaw } from "@ledgerhq/live-common/account/index";
import { NavigatorName } from "../../src/const";
import { Subject } from "rxjs";
import { MessageData, MockDeviceEvent } from "./client";
import { BleState } from "../../src/reducers/types";
import { Account, AccountRaw } from "@ledgerhq/types-live";
import { DeviceUSB, nanoSP_USB, nanoS_USB, nanoX_USB } from "../models/devices";

type ServerData =
  | {
      type: "walletAPIResponse";
      payload: string;
    }
  | {
      type: "appLogs";
      fileName: string;
      payload: string;
    };
export const e2eBridgeServer = new Subject<ServerData>();

let wss: Server;
let onConnectionPromise: Promise<WebSocket> | null = null;

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function init(port = 8099, onConnection = () => {}): Promise<WebSocket> {
  onConnectionPromise = new Promise(resolve => {
    wss = new Server({ port });
    log(`Start listening on localhost:${port}`);

    wss.on("connection", ws => {
      log(`Client connected`);
      onConnection();
      resolve(ws); // Resolve the promise when a client connects
      ws.on("message", onMessage);
    });
  });
  return onConnectionPromise;
}

export function close() {
  wss?.close();
}

export function loadConfig(fileName: string, agreed: true = true): void {
  if (agreed) {
    acceptTerms();
  }

  const f = fs.readFileSync(path.resolve("e2e", "setups", `${fileName}.json`), "utf8");

  const { data } = JSON.parse(f.toString());

  postMessage({ type: "importSettings", payload: data.settings });

  navigate(NavigatorName.Base);

  if (data.accounts.length) {
    postMessage({ type: "importAccounts", payload: data.accounts });
  }
}

export function loadBleState(bleState: BleState) {
  postMessage({ type: "importBle", payload: bleState });
}

export function loadAccountsRaw(
  payload: {
    data: AccountRaw;
    version: number;
  }[],
) {
  postMessage({
    type: "importAccounts",
    payload,
  });
}

export function loadAccounts(accounts: Account[]) {
  postMessage({
    type: "importAccounts",
    payload: accounts.map(account => ({
      version: 1,
      data: toAccountRaw(account),
    })),
  });
}

function navigate(name: string) {
  postMessage({
    type: "navigate",
    payload: name,
  });
}

export function mockDeviceEvent(...args: MockDeviceEvent[]) {
  postMessage({
    type: "mockDeviceEvent",
    payload: args,
  });
}

export function addDevicesBT(
  deviceNames: string | string[] = [
    "Nano X de David",
    "Nano X de Arnaud",
    "Nano X de Didier Duchmol",
  ],
): string[] {
  const names = Array.isArray(deviceNames) ? deviceNames : [deviceNames];
  names.forEach((name, i) => {
    postMessage({
      type: "add",
      payload: { id: `mock_${i + 1}`, name, serviceUUID: `uuid_${i + 1}` },
    });
  });
  return names;
}

export function addDevicesUSB(
  devices: DeviceUSB | DeviceUSB[] = [nanoX_USB, nanoSP_USB, nanoS_USB],
): DeviceUSB[] {
  const devicesArray = Array.isArray(devices) ? devices : [devices];
  devicesArray.forEach(device => {
    postMessage({ type: "addUSB", payload: device });
  });
  return devicesArray;
}

export function setInstalledApps(apps: string[] = []) {
  postMessage({
    type: "setGlobals",
    payload: { _listInstalledApps_mock_result: apps },
  });
}

export function open() {
  postMessage({ type: "open" });
}

export function getLogs(fileName: string) {
  postMessage({ type: "getLogs", fileName: fileName });
}

function onMessage(messageStr: string) {
  const msg: ServerData = JSON.parse(messageStr);
  log(`Message\n${JSON.stringify(msg, null, 2)}`);

  switch (msg.type) {
    case "walletAPIResponse":
      e2eBridgeServer.next(msg);
      break;
    case "appLogs":
      const [date, time] = new Date().toISOString().split(".")[0].replace(/:/g, "-").split("T");
      const fileName = `${date}_${time}-${msg.fileName}.json`;
      const directoryPath = `artifacts/${date}_ledger_live_mobile`;
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }
      fs.writeFileSync(`${directoryPath}/${fileName}`, msg.payload, "utf-8");
      break;
    default:
      break;
  }
}

function log(message: string) {
  // eslint-disable-next-line no-console
  console.log(`[E2E Bridge Server]: ${message}`);
}

function acceptTerms() {
  postMessage({ type: "acceptTerms" });
}

async function postMessage(message: MessageData) {
  const ws = await onConnectionPromise; // Wait until a client is connected and get the WebSocket instance
  if (ws) {
    ws.send(JSON.stringify(message));
  } else {
    log("WebSocket connection is not open. Message not sent.");
  }
}
