import { Server } from "ws";
import path from "path";
import fs from "fs";
import net from "net";
import merge from "lodash/merge";

import { NavigatorName } from "../../../apps/ledger-live-mobile/src/const";
import {
  MessageData,
  OverrideFeatureFlagPayload,
  ServerData,
} from "../../../apps/ledger-live-mobile/e2e/bridge/types";
import type { PartialFeatures, FeatureId } from "@shared/feature-flags";
import { FeatureIdSchema } from "@shared/feature-flags";
import { log as detoxLog } from "detox";
import { getSpeculosModel } from "@ledgerhq/live-common/e2e/speculosAppVersion";
import { v4 as uuid } from "uuid";

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
  return uuid();
}

function isFeatureId(key: string): key is FeatureId {
  return FeatureIdSchema.safeParse(key).success;
}

export function init(port = 8099, onConnection?: () => void) {
  webSocket.wss = new Server({ port });
  webSocket.messages = {};
  log(`Start listening on localhost:${port}`);

  webSocket.wss.on("connection", ws => {
    log(`Client connected`);
    if (onConnection) onConnection();
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

  if (global.pendingCallbacks) {
    global.pendingCallbacks.clear();
  }
}

export async function loadConfig(fileName: string, agreed: true = true): Promise<void> {
  if (agreed) {
    await acceptTerms();
  }

  const f = fs.readFileSync(path.resolve("userdata", `${fileName}.json`), "utf8");

  const { data } = JSON.parse(f.toString());

  const defaultSettings = { shareAnalytics: false, hasSeenAnalyticsOptInPrompt: true };
  const settings = merge(defaultSettings, data.settings || {});
  postMessage({ type: "importSettings", id: uniqueId(), payload: settings });

  await navigate(NavigatorName.Base);

  if (data.accounts?.length) {
    postMessage({ type: "importAccounts", id: uniqueId(), payload: data.accounts });
  }

  if (data.featureFlags?.overrides) {
    await setFeatureFlags(data.featureFlags.overrides);
  }
}

export async function setFeatureFlags(flags: PartialFeatures) {
  for (const id in flags) {
    if (isFeatureId(id)) {
      setFeatureFlag({ id, value: flags[id] });
    }
  }
  await getFlags();
}

export async function setFeatureFlag(flag: OverrideFeatureFlagPayload) {
  postMessage({ type: "overrideFeatureFlag", id: uniqueId(), payload: flag });
}

async function navigate(name: string) {
  postMessage({
    type: "navigate",
    id: uniqueId(),
    payload: name,
  });
}

export async function swapSetup() {
  if (!process.env.SWAP_API_BASE) {
    console.warn("[swapSetup] SWAP_API_BASE env var is not set, will use client-side default");
  }
  return fetchData({ type: "swapSetup", id: uniqueId(), swapApiBase: process.env.SWAP_API_BASE });
}

export async function waitSwapReady() {
  return fetchData({ type: "waitSwapReady", id: uniqueId() }, RESPONSE_TIMEOUT * 3);
}

export async function waitEarnReady() {
  return fetchData({ type: "waitEarnReady", id: uniqueId() }, RESPONSE_TIMEOUT * 3);
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
      global.pendingCallbacks?.delete(message.type);
      delete webSocket.messages[message.id];
      console.warn(`Timeout while waiting for ${message.type}`);
      resolve("");
    }, timeout);

    global.pendingCallbacks.set(message.type, {
      callback: (data: string) => {
        clearTimeout(timeoutId);
        global.pendingCallbacks?.delete(message.type);
        resolve(data);
      },
    });
  });
}

export async function addKnownSpeculos(address: string) {
  postMessage({
    type: "addKnownSpeculos",
    id: uniqueId(),
    payload: JSON.stringify({ address, model: getSpeculosModel() }),
  });
}

export async function removeKnownSpeculos(address: string) {
  postMessage({ type: "removeKnownSpeculos", id: uniqueId(), payload: address });
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
      const pending = global.pendingCallbacks?.get("getLogs");
      if (pending) {
        global.pendingCallbacks.delete("getLogs");
        pending.callback(msg.payload);
      }
      break;
    }
    case "appFlags": {
      const pending = global.pendingCallbacks?.get("getFlags");
      if (pending) {
        global.pendingCallbacks.delete("getFlags");
        pending.callback(msg.payload);
      }
      break;
    }
    case "appEnvs": {
      const pending = global.pendingCallbacks?.get("getEnvs");
      if (pending) {
        global.pendingCallbacks.delete("getEnvs");
        pending.callback(msg.payload);
      }
      break;
    }
    case "swapSetupDone": {
      const pending = global.pendingCallbacks?.get("swapSetup");
      if (pending) {
        global.pendingCallbacks.delete("swapSetup");
        pending.callback("swapSetup done");
      }
      break;
    }
    case "swapLiveAppReady": {
      const pending = global.pendingCallbacks?.get("waitSwapReady");
      if (pending) {
        global.pendingCallbacks.delete("waitSwapReady");
        pending.callback("Swap Live App is ready");
      }
      break;
    }
    case "earnLiveAppReady": {
      const pending = global.pendingCallbacks?.get("waitEarnReady");
      if (pending) {
        global.pendingCallbacks.delete("waitEarnReady");
        pending.callback("Earn Live App is ready");
      }
      break;
    }
    case "appFile":
      try {
        const { fileName, fileContent }: { fileName: string; fileContent: string } = JSON.parse(
          msg.payload,
        );
        const artifactsDir = path.resolve(__dirname, "../artifacts");
        if (!fs.existsSync(artifactsDir)) {
          fs.mkdirSync(artifactsDir, { recursive: true });
        }
        const filePath = path.join(artifactsDir, fileName);
        fs.writeFileSync(filePath, fileContent, "utf8");
      } catch (err) {
        log(`Failed to save file: ${err}`);
      }
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
