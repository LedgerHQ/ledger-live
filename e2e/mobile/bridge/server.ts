import { Server } from "ws";
import path from "path";
import fs from "fs";
import net from "net";
import merge from "lodash/merge";

import { NavigatorName } from "~/const";
import { BleState } from "~/reducers/types";
import { MessageData, MockDeviceEvent, ServerData } from "./types";
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
          resolve(port);
        });
      } else {
        log("Unable to determine port. Selecting default");
        resolve(8099);
      }
    });

    server.on("error", err => {
      reject(err);
    });

    server.listen(0);
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
  postMessage({ type: "importSettings", id: uniqueId(), payload: settings });

  await navigate(NavigatorName.Base);

  if (data.accounts?.length) {
    postMessage({ type: "importAccounts", id: uniqueId(), payload: data.accounts });
  }
}

export async function setFeatureFlags(flags: SettingsSetOverriddenFeatureFlagsPlayload) {
  postMessage({ type: "overrideFeatureFlags", id: uniqueId(), payload: flags });
}

export async function loadBleState(bleState: BleState) {
  postMessage({ type: "importBle", id: uniqueId(), payload: bleState });
}

async function navigate(name: string) {
  postMessage({
    type: "navigate",
    id: uniqueId(),
    payload: name,
  });
}

export async function mockDeviceEvent(...args: MockDeviceEvent[]) {
  postMessage({
    type: "mockDeviceEvent",
    id: uniqueId(),
    payload: args,
  });
}

export async function open() {
  postMessage({ type: "open", id: uniqueId() });
}

export async function swapSetup() {
  postMessage({ type: "swapSetup", id: uniqueId() });
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
  postMessage({ type: "addKnownSpeculos", id: uniqueId(), payload: proxyAddress });
}

export async function removeKnownSpeculos(id: string) {
  postMessage({ type: "removeKnownSpeculos", id: uniqueId(), payload: id });
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
  postMessage({ type: "acceptTerms", id: uniqueId() });
}

function postMessage(message: MessageData) {
  log(`Message sending ${message.type}: ${message.id}`);
  try {
    webSocket.messages[message.id] = message;
    if (webSocket.ws) {
      webSocket.ws.send(JSON.stringify(message));
    } else {
      log("WebSocket connection is not open. Message not sent.");
    }
  } catch (error: unknown) {
    detoxLog.error(
      `Error occurred while waiting for WebSocket connection: ${JSON.stringify(error)}`,
    );
  }
}
