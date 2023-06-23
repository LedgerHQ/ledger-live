import { Server } from "ws";
import path from "path";
import fs from "fs";
import { NavigatorName } from "../../src/const";
import { getTestManifest } from "../setups/manifests/testManifest";

let wss: Server;

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function init(port = 8099, onConnection = () => {}) {
  wss = new Server({ port });
  log(`Start listening on localhost:${port}`);

  wss.on("connection", ws => {
    log(`Connection`);
    onConnection();
    ws.on("message", onMessage);
  });
}

export function close() {
  wss?.close();
}

export function loadConfig(fileName: string, agreed: true = true): void {
  if (agreed) {
    acceptTerms();
  }

  const f = fs.readFileSync(
    path.resolve("e2e", "setups", `${fileName}.json`),
    "utf8",
  );

  const { data } = JSON.parse(f.toString());

  postMessage({ type: "importSettings", payload: data.settings });

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
      payload: { id: `mock_${i + 1}`, name, serviceUUID: `uuid_${i + 1}` },
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

export function openNano() {
  postMessage({ type: "openNano", payload: null });
}

// in future pass the manifest in as an argument
export function loadLocalManifest(): void {
  console.log("passing in manifest");
  const manifest = getTestManifest();
  postMessage({ type: "loadLocalManifest", payload: manifest });
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

function postMessage(message: { type: string; payload: unknown }) {
  for (const ws of wss.clients.values()) {
    ws.send(JSON.stringify(message));
  }
}
