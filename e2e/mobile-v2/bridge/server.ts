import { Server, type WebSocket } from "ws";
import path from "node:path";
import fs from "node:fs";
import type { IncomingMessage } from "node:http";
import { randomBytes, timingSafeEqual } from "node:crypto";
import merge from "lodash/merge";
import { v4 as uuid } from "uuid";

import type { Contact } from "@domain/entity-contact";
import type {
  MessageData,
  OverrideFeatureFlagPayload,
  ServerData,
} from "@ledgerhq/live-e2e-shared/bridge/types";
import type { PartialFeatures } from "@shared/feature-flags";
import { FeatureIdSchema } from "@shared/feature-flags";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { getSpeculosModel } from "@ledgerhq/live-e2e-shared/speculosAppVersion";
import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";

import logger from "@wdio/logger";

/** The base navigator name used in the app's navigation structure. Declared here to avoid dependency on app src. */
const NAVIGATOR_NAME_BASE = "Base";

/** Round-trip to the app over the bridge. Exported so a caller can bound a bridge call from outside. */
const BRIDGE_RESPONSE_TIMEOUT = TIMEOUT.medium;

type PendingCallback = { callback: (data: string) => void };
/** Several callers can wait on one fixed key (e.g. `waitSwapReady`), so each key holds a set. */
type PendingMap = Map<string, Set<PendingCallback>>;

const bridgeLogger = logger("Bridge Server");

/**
 * Socket state for the current worker's bridge. Only `initBridge` and `closeBridge` replace it.
 * Per process: valid in worker hooks and specs, empty in launcher hooks such as `onWorkerStart`.
 */
const webSocket: {
  wss: Server | undefined;
  ws: WebSocket | undefined;
  messages: { [id: string]: MessageData };
} = {
  wss: undefined,
  ws: undefined,
  messages: {},
};

/** Bridge calls waiting for an app response, keyed by correlation key. */
const pendingResponses: PendingMap = new Map();
/** Bridge messages waiting for an app `ACK`, keyed by message id. */
const pendingAcks: PendingMap = new Map();

function addPending(pending: PendingMap, key: string, entry: PendingCallback) {
  const waiters = pending.get(key) ?? new Set<PendingCallback>();
  waiters.add(entry);
  pending.set(key, waiters);
}

function removePending(pending: PendingMap, key: string, entry: PendingCallback) {
  const waiters = pending.get(key);
  if (!waiters) return;
  waiters.delete(entry);
  if (waiters.size === 0) pending.delete(key);
}

function hasBridgeToken(url: string | undefined, token: string): boolean {
  const received = Buffer.from(
    new URL(url ?? "/", "ws://localhost").searchParams.get("token") ?? "",
  );
  const expected = Buffer.from(token);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function createBridgeToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Starts the bridge and returns the secret the app must connect with, passed to it as a launch arg.
 * Pass the token when the app is launched before the bridge starts, so both sides share it.
 */
export function initBridge({
  port = 8099,
  onConnection,
  token,
}: {
  port?: number;
  onConnection?: () => void;
  token?: string;
}): string {
  token = token ?? createBridgeToken();
  webSocket.wss = new Server({
    port,
    verifyClient: ({ req }: { req: IncomingMessage }) => hasBridgeToken(req.url, token),
  });
  webSocket.messages = {};
  bridgeLogger.info(`Start listening on localhost:${port}`);

  webSocket.wss.on("connection", ws => {
    bridgeLogger.info(`Client connected`);
    if (onConnection) onConnection();
    webSocket.ws?.close();
    webSocket.ws = ws;
    ws.on("message", onMessage);
    ws.on("close", () => {
      bridgeLogger.info("Client disconnected");
      if (webSocket.ws === ws) webSocket.ws = undefined;
    });
    if (Object.keys(webSocket.messages).length !== 0) {
      bridgeLogger.info(`Sending unsent messages`);
      Object.values(webSocket.messages).forEach(message => {
        postMessage(message);
      });
    }
  });
  return token;
}

export async function closeBridge(): Promise<void> {
  if (webSocket.ws) {
    webSocket.ws.removeAllListeners();
    webSocket.ws.close();
    webSocket.ws = undefined;
  }

  const wss = webSocket.wss;
  if (wss) {
    wss.clients.forEach(client => {
      client.removeAllListeners();
      client.terminate();
    });

    await closeWithTimeout(wss);
  }
  webSocket.messages = {};

  pendingResponses.clear();
  pendingAcks.clear();
}

async function closeWithTimeout(wss: Server): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>(resolve => {
    timer = setTimeout(() => {
      bridgeLogger.warn(`closeBridge timed out after ${TIMEOUT.small}ms; skipping`);
      resolve();
    }, TIMEOUT.small);
  });
  const closed = new Promise<void>(resolve => {
    wss.close(error => {
      if (webSocket.wss === wss) {
        webSocket.wss = undefined;
      }
      if (error) bridgeLogger.warn(`closeBridge failed: ${error.message}`);
      resolve();
    });
  });
  try {
    await Promise.race([closed, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
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
  postMessage({ type: "importSettings", id: uuid(), payload: settings });

  await navigate(NAVIGATOR_NAME_BASE);

  if (data.accounts?.length) {
    await postMessage({ type: "importAccounts", id: uuid(), payload: data.accounts });
  }

  // Written by LedgerSyncCliHelper.saveTrustchainToUserdata, so the app boots already a member
  // of the trustchain the CLI created and skips the in-app activation flow.
  if (data.trustchain) {
    postMessage({ type: "importTrustchain", id: uuid(), payload: data.trustchain });
  }

  if (data.postOnboarding) {
    postMessage({ type: "importPostOnboarding", id: uuid(), payload: data.postOnboarding });
  }

  if (data.payCard) {
    postMessage({ type: "importPayCard", id: uuid(), payload: data.payCard });
  }

  if (data.receiveVerifyHint) {
    postMessage({
      type: "importReceiveVerifyHint",
      id: uuid(),
      payload: data.receiveVerifyHint,
    });
  }

  if (data.featureFlags?.overrides) {
    await setFeatureFlags(data.featureFlags.overrides);
  }
}

export async function setFeatureFlags(flags: PartialFeatures) {
  for (const id in flags) {
    const featureId = FeatureIdSchema.safeParse(id);
    if (featureId.success) {
      setFeatureFlag({ id: featureId.data, value: flags[featureId.data] });
    }
  }
  await getFlags();
}

export function setFeatureFlag(flag: OverrideFeatureFlagPayload) {
  postMessage({ type: "overrideFeatureFlag", id: uuid(), payload: flag });
}

export async function importContacts(contacts: Contact[]) {
  await fetchData({ type: "importContacts", id: uuid(), payload: contacts });
}

/** Replaces the app's coin-config overrides (deep-merged over its default and remote config). */
export async function overrideLiveConfig(payload: Record<string, unknown>) {
  await postAndAwaitAck({ type: "overrideLiveConfig", id: uuid(), payload });
}

export async function importLocalManifests(manifests: LiveAppManifest[]) {
  const importedIds = await fetchData({
    type: "importLocalManifests",
    id: uuid(),
    payload: manifests,
  });
  if (!importedIds) {
    throw new Error(
      "importLocalManifests: the app did not confirm the import, is the installed e2e build older than this bridge message?",
    );
  }
}

async function navigate(name: string) {
  postMessage({
    type: "navigate",
    id: uuid(),
    payload: name,
  });
}

export async function swapSetup() {
  if (!process.env.SWAP_API_BASE) {
    bridgeLogger.warn("[swapSetup] SWAP_API_BASE env var is not set, will use client-side default");
  }
  return fetchData({ type: "swapSetup", id: uuid(), swapApiBase: process.env.SWAP_API_BASE });
}

export async function waitSwapReady() {
  return fetchData({ type: "waitSwapReady", id: uuid() }, TIMEOUT.xlarge, "waitSwapReady");
}

export async function waitEarnReady() {
  return fetchData({ type: "waitEarnReady", id: uuid() }, TIMEOUT.xlarge, "waitEarnReady");
}

export async function getLogs() {
  return fetchData({ type: "getLogs", id: uuid() });
}

export async function getFlags() {
  return fetchData({ type: "getFlags", id: uuid() });
}

export async function getEnvs() {
  return fetchData({ type: "getEnvs", id: uuid() });
}

/** Last Buy/Sell handoff URL (`goToManifest` + `goToURL`) seen by the app, or "" if none yet. */
export async function getPtxHandoff() {
  return fetchData({ type: "getPtxHandoff", id: uuid() });
}

export async function fetchData(
  message: MessageData,
  timeout = BRIDGE_RESPONSE_TIMEOUT,
  correlationKey: string = message.id,
): Promise<string> {
  return new Promise<string>(resolve => {
    postMessage(message);
    const timeoutId = setTimeout(() => {
      removePending(pendingResponses, correlationKey, entry);
      delete webSocket.messages[message.id];
      bridgeLogger.warn(`Timeout while waiting for ${message.type}`);
      resolve("");
    }, timeout);

    const entry: PendingCallback = {
      callback: (data: string) => {
        clearTimeout(timeoutId);
        resolve(data);
      },
    };
    addPending(pendingResponses, correlationKey, entry);
  });
}

function postAndAwaitAck(message: MessageData, timeout = BRIDGE_RESPONSE_TIMEOUT): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      removePending(pendingAcks, message.id, entry);
      delete webSocket.messages[message.id];
      reject(new Error(`The app didn't acknowledge ${message.type} within ${timeout}ms`));
    }, timeout);

    const entry: PendingCallback = {
      callback: () => {
        clearTimeout(timeoutId);
        resolve();
      },
    };
    addPending(pendingAcks, message.id, entry);
    postMessage(message);
  });
}

export async function addKnownSpeculos(address: string) {
  postMessage({
    type: "addKnownSpeculos",
    id: uuid(),
    payload: JSON.stringify({
      address,
      model: getSpeculosModel(),
      sessionToken: process.env.SPECULOS_SESSION_TOKEN,
    }),
  });
}

export async function removeKnownSpeculos(address: string) {
  postMessage({ type: "removeKnownSpeculos", id: uuid(), payload: address });
}

/** Resolve every bridge call waiting on `key` in `pending`, if any. */
function resolvePending(pending: PendingMap, key: string, payload: string) {
  const waiters = pending.get(key);
  if (!waiters) return;
  pending.delete(key);
  waiters.forEach(entry => entry.callback(payload));
}

function onMessage(messageStr: string) {
  const msg: ServerData = JSON.parse(messageStr);
  bridgeLogger.info(`Message received ${msg.type}`);

  switch (msg.type) {
    case "ACK":
      bridgeLogger.info(`${msg.id}`);
      delete webSocket.messages[msg.id];
      resolvePending(pendingAcks, msg.id, "");
      break;
    case "appLogs":
    case "ptxHandoff":
    case "appFlags":
    case "appEnvs":
    case "contactsImported":
    case "localManifestsImported":
      resolvePending(pendingResponses, msg.id, msg.payload);
      break;
    case "swapSetupDone":
      resolvePending(pendingResponses, msg.id, "swapSetup done");
      break;
    case "swapLiveAppReady":
      resolvePending(pendingResponses, "waitSwapReady", "Swap Live App is ready");
      break;
    case "earnLiveAppReady":
      resolvePending(pendingResponses, "waitEarnReady", "Earn Live App is ready");
      break;
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
        bridgeLogger.warn(`Failed to save file: ${err}`);
      }
      break;
    default:
      break;
  }
}

async function acceptTerms() {
  postMessage({ type: "acceptTerms", id: uuid() });
}

function postMessage(message: MessageData) {
  bridgeLogger.info(`Message sending ${message.type}: ${message.id}`);
  try {
    webSocket.messages[message.id] = message;
    if (webSocket.ws) {
      webSocket.ws.send(JSON.stringify(message));
    } else {
      bridgeLogger.warn("WebSocket connection is not open. Message not sent.");
    }
  } catch (error: unknown) {
    bridgeLogger.warn(
      `Error occurred while waiting for WebSocket connection: ${JSON.stringify(error)}`,
    );
  }
}
