#!/usr/bin/env bun
// HTTP + WebSocket APDU proxy reusing the wallet-cli DMK stack: a drop-in for the
// legacy `run:cli proxy`, without the node-hid native build.
import "./embed-usb-native";
import os from "node:os";
import {
  ensureWalletCliDmkTransport,
  getWalletCliDeviceModelId,
  registerWalletCliDmkTransport,
} from "./device/register-dmk-transport";
import { walletCliDebug } from "./shared/log";
import { colors, writeStderr } from "./shared/ui";

const DEFAULT_PORT = 8435;

type WsData = { id: number; opened: boolean };

type ProxyArgs = { port: number; silent: boolean };

function parseArgs(argv: string[]): ProxyArgs {
  let port = DEFAULT_PORT;
  let silent = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--silent" || arg === "-s") silent = true;
    else if (arg === "--port" || arg === "-p") port = Number(argv[++i]);
    else if (arg.startsWith("--port=")) port = Number(arg.slice("--port=".length));
  }
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid --port "${port}".`);
  }
  return { port, silent };
}

/** APDUs must hit the device one at a time: a single DMK session can't multiplex exchanges. */
function createExchangeQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return function serialize<T>(fn: () => Promise<T>): Promise<T> {
    const run = tail.then(fn, fn);
    tail = run.then(
      () => {},
      () => {},
    );
    return run;
  };
}

function lanWebSocketUrls(port: number): string[] {
  const ips = Object.values(os.networkInterfaces())
    .flatMap(iface => iface ?? [])
    .filter(i => i.family === "IPv4" && !i.internal)
    .map(i => i.address);
  return ["localhost", ...ips].map(ip => `ws://${ip}:${port}`);
}

function main(): void {
  const { port, silent } = parseArgs(process.argv.slice(2));
  const serialize = createExchangeQueue();
  let wsIndex = 0;

  // Registers the shared SIGINT/SIGTERM USB teardown hooks.
  registerWalletCliDmkTransport();

  const log = (message: string) => writeStderr(`${colors.dim("[proxy]")} ${message}\n`);
  const vlog = (message: string) => {
    if (!silent) log(message);
  };
  const logApdu = (label: string, request: string, response: string) =>
    vlog(`${label}: ${request} => ${response}`);

  const exchange = (apduHex: string): Promise<string> =>
    serialize(async () => {
      // Buffer.from(_, "hex") silently truncates invalid/odd-length input; reject it instead.
      if (apduHex.length === 0 || apduHex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(apduHex)) {
        throw new Error(`Invalid APDU hex: "${apduHex}"`);
      }
      const transport = await ensureWalletCliDmkTransport();
      const response = await transport.exchange(Buffer.from(apduHex, "hex"));
      return response.toString("hex");
    });

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
  };

  Bun.serve<WsData>({
    port,
    async fetch(req, srv) {
      // id is assigned in the websocket `open` handler so plain HTTP traffic doesn't bump it.
      if (srv.upgrade(req, { data: { id: 0, opened: false } })) {
        return undefined;
      }

      const { pathname } = new URL(req.url);

      if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      if (req.method === "GET" && pathname === "/metadata") {
        try {
          const deviceModelId = await serialize(async () => {
            await ensureWalletCliDmkTransport();
            return (await getWalletCliDeviceModelId()) ?? null;
          });
          return Response.json({ deviceModelId }, { headers: corsHeaders });
        } catch (e) {
          return Response.json(
            { error: (e as Error).message, deviceModelId: null },
            { status: 500, headers: corsHeaders },
          );
        }
      }

      if (req.method === "GET") {
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      if (req.method === "POST" && pathname === "/") {
        const { apduHex } = (await req.json().catch(() => ({}))) as { apduHex?: string };
        if (!apduHex) {
          return new Response(null, { status: 400, headers: corsHeaders });
        }
        try {
          const data = await exchange(apduHex);
          logApdu("HTTP", apduHex, data);
          return Response.json({ data, error: null }, { headers: corsHeaders });
        } catch (e) {
          const error = (e as Error).message;
          logApdu("HTTP", apduHex, `<error: ${error}>`);
          return Response.json({ data: null, error }, { headers: corsHeaders });
        }
      }

      return new Response(null, { status: 405, headers: corsHeaders });
    },
    websocket: {
      open(ws) {
        ws.data.id = ++wsIndex;
      },
      async message(ws, raw) {
        const apduHex = typeof raw === "string" ? raw : Buffer.from(raw).toString();
        // exchange resolves asynchronously: the client may already be gone by then.
        const reply = (payload: object) => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
        };

        if (apduHex === "open") {
          // Connect eagerly so a connection failure closes the socket instead of hanging the client.
          vlog(`WS(${ws.data.id}): opening — connecting to device…`);
          try {
            await serialize(() => ensureWalletCliDmkTransport());
            ws.data.opened = true;
            vlog(`WS(${ws.data.id}): opened`);
            reply({ type: "opened" });
          } catch (e) {
            log(`WS(${ws.data.id}): open failed — ${(e as Error).message}`);
            reply({ type: "error", error: (e as Error).message });
            ws.close();
          }
          return;
        }

        if (!ws.data.opened) {
          walletCliDebug(`WS(${ws.data.id}): message before open, ignoring`);
          return;
        }

        try {
          const data = await exchange(apduHex);
          logApdu(`WS(${ws.data.id})`, apduHex, data);
          reply({ type: "response", data });
        } catch (e) {
          const error = (e as Error).message;
          logApdu(`WS(${ws.data.id})`, apduHex, `<error: ${error}>`);
          reply({ type: "error", error });
        }
      },
      close(ws) {
        vlog(`WS(${ws.data.id}): close`);
      },
    },
  });

  log(`APDU proxy listening on port ${port}`);
  for (const url of lanWebSocketUrls(port)) {
    log(`DEVICE_PROXY_URL=${url}`);
  }
  log("Press Ctrl+C to stop.");
}

if (import.meta.main) {
  main();
}
