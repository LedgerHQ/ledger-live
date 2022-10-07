import { Server } from "ws";
import path from "path";
import fs from "fs";
import type { E2EBridgeMessage } from "./client";
import { NavigatorName } from "../../src/const";

let wss: Server;

export function init(port?: number = 8099) {
  wss = new Server({ port });
  log(`Start listening on localhost:${port}`);

  wss.on("connection", ws => {
    log(`Connection`);
    ws.on("message", onMessage);
  });
}

export function close() {
  wss?.close();
}

export async function loadConfig(
  fileName: string,
  agreed?: true = true,
): Promise<void> {
  if (agreed) {
    acceptTerms();
  }

  const f = fs.readFileSync(path.resolve("e2e", "setups", `${fileName}.json`));
  // $FlowFixMe
  const { data } = JSON.parse(f);

  postMessage({ type: "importSettngs", payload: data.settings });

  navigate(NavigatorName.Base);

  if (data.accounts.length) {
    postMessage({ type: "importAccounts", payload: data.accounts });
  }
}

function navigate(name: string) {
  postMessage({
    type: "navigate",
    payload: name,
  });
}

export function addDevices(
  deviceNames: string[] = [
    "Nano X de David",
    "Nano X de Arnaud",
    "Nano X de Didier Duchmol",
  ],
): string[] {
  deviceNames.forEach((name, i) => {
    postMessage({
      type: "add",
      payload: { id: `mock_${i + 1}`, name },
    });
  });
  return deviceNames;
}

export function setInstalledApps(apps: string[] = []) {
  postMessage({
    type: "setGlobals",
    payload: { _listInstalledApps_mock_result: apps },
  });
}

export function open() {
  postMessage({ type: "open", payload: null });
}

function onMessage(messageStr: string) {
  const msg = JSON.parse(messageStr);
  log(`Message\n${JSON.stringify(msg, null, 2)}`);

  switch (msg.type) {
    default:
      break;
  }
}

function log(message: string) {
  // eslint-disable-next-line no-console
  console.log(`[E2E Bridge Server]: ${message}`);
}

function acceptTerms() {
  postMessage({ type: "acceptTerms", payload: null });
}

function postMessage(message: E2EBridgeMessage) {
  for (const ws of wss.clients.values()) {
    ws.send(JSON.stringify(message));
  }
}
