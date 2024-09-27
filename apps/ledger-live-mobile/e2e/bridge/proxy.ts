/* eslint-disable global-require */
import { log, listen } from "@ledgerhq/logs";
import { open, registerTransportModule, TransportModule } from "@ledgerhq/live-common/hw/index";
import http from "http";
import express from "express";
import cors from "cors";
import WebSocket from "ws";
import bodyParser from "body-parser";
import os from "os";
import { Observable, Subscription } from "rxjs";
import SpeculosHttpTransport, {
  SpeculosHttpTransportOpts,
} from "@ledgerhq/hw-transport-node-speculos-http";
import { retry } from "@ledgerhq/live-common/promise";
import { Buffer } from "buffer";
import { findFreePort } from "./server";
import { getEnv } from "@ledgerhq/live-env";
import invariant from "invariant";

const proxySubscriptions: [string, Subscription][] = [];

let transport: TransportModule;

interface ProxyOptions {
  device: string;
  port: string;
  silent?: boolean;
  verbose?: boolean;
  speculosApiPort: string;
}

export async function startProxy(speculosApiPort?: string, proxyPort?: string): Promise<string> {
  if (!proxyPort) proxyPort = (await findFreePort()).toString();
  if (!speculosApiPort) speculosApiPort = getEnv("SPECULOS_API_PORT").toString();
  invariant(speculosApiPort, "E2E Proxy : speculosApiPort is not defined");
  invariant(proxyPort, "E2E Proxy : proxyPort is not defined");

  return new Promise((resolve, reject) => {
    const options: ProxyOptions = {
      device: `speculos-${proxyPort}`,
      port: proxyPort,
      silent: true,
      verbose: false,
      speculosApiPort,
    };

    const observable = job(options);

    proxySubscriptions.push([
      proxyPort,
      observable.subscribe({
        next: message => {
          if (Array.isArray(message)) {
            const address = `${message[0]}:${proxyPort}`;
            console.warn("Proxy started on :", address);
            resolve(address);
          } else {
            console.warn(message);
          }
        },
        error: err => {
          console.error("Error:", err);
          reject(err);
        },
        complete: () => console.warn("Proxy stopped."),
      }),
    ]);
  });
}

export function closeProxy(proxyPort?: string) {
  if (!proxyPort) {
    for (const [, subscription] of proxySubscriptions) {
      subscription.unsubscribe();
    }
    return;
  }
  const proxySubscription = proxySubscriptions.find(([string]) => string === proxyPort)?.[1];
  if (proxySubscription) {
    proxySubscription.unsubscribe();
    proxySubscriptions.splice(proxySubscriptions.indexOf([proxyPort, proxySubscription]));
  }
}

const job = ({ device, port, silent, verbose, speculosApiPort }: ProxyOptions) =>
  new Observable(observer => {
    const req: SpeculosHttpTransportOpts = {
      apiPort: speculosApiPort,
    };

    transport = {
      id: `speculos-http-${speculosApiPort}`,
      open: id => (id.includes(port) ? retry(() => SpeculosHttpTransport.open(req)) : null),
      disconnect: () => Promise.resolve(),
    };
    registerTransportModule(transport);

    const unsubscribe = listen(logMessage => {
      if (verbose) {
        observer.next(`${logMessage.type}: ${logMessage.message}`);
      } else if (!silent && logMessage.type === "proxy") {
        observer.next(logMessage.message);
      }
    });

    const Transport = {
      open: () => open(device || ""),
      create: () => open(device || ""),
    };

    const ifaces = os.networkInterfaces();
    const ips = Object.keys(ifaces)
      .reduce<string[]>((acc, ifname) => {
        const addresses =
          ifaces[ifname]
            ?.filter(iface => iface.family === "IPv4" && !iface.internal)
            .map(iface => iface.address) || [];
        return acc.concat(addresses);
      }, [])
      .filter(Boolean);

    const app = express();
    const server = http.createServer(app);
    const wss = new WebSocket.Server({ server });

    app.use(cors());
    app.get("/", (_, res) => res.sendStatus(200));

    let pending = false;
    app.post("/", bodyParser.json(), async (req, res) => {
      if (!req.body) return res.sendStatus(400);

      if (pending) {
        return res.status(400).json({ error: "An exchange query is already pending" });
      }

      pending = true;
      let data = null;
      let error: Error | null = null;

      try {
        const transport = await Transport.open();
        try {
          data = await transport.exchange(Buffer.from(req.body.apduHex, "hex"));
        } finally {
          transport.close();
        }
      } catch (e) {
        error = e as Error;
      }

      pending = false;
      res.json({ data, error });

      const logArgs = ["proxy", "HTTP:", req.body.apduHex, "=>"];
      if (data) {
        log("proxy", ...logArgs, data.toString("hex"));
      } else {
        log("proxy", ...logArgs, error);
      }

      if (error?.name === "RecordStoreWrongAPDU") {
        console.error(error.message);
        process.exit(1);
      }
    });

    let wsIndex = 0;
    let wsBusyIndex = 0;
    wss.on("connection", (ws: WebSocket) => {
      const index = ++wsIndex;
      let transport: SpeculosHttpTransport;
      let transportP: Promise<SpeculosHttpTransport>;
      let destroyed = false;

      const onClose = async () => {
        if (destroyed) return;
        destroyed = true;

        if (wsBusyIndex === index) {
          log("proxy", `WS(${index}): close`);
          await transportP.then(
            t => t.close(),
            () => {},
          );
          wsBusyIndex = 0;
        }
      };

      ws.on("close", onClose);
      ws.on("message", async (data, isBinary) => {
        if (destroyed) return;

        const apduHex = isBinary ? data : data.toString();
        if (apduHex === "open") {
          if (wsBusyIndex) {
            ws.send(JSON.stringify({ error: "WebSocket is busy (previous session not closed)" }));
            ws.close();
            destroyed = true;
            return;
          }

          transportP = Transport.open() as Promise<SpeculosHttpTransport>;
          wsBusyIndex = index;
          log("proxy", `WS(${index}): opening...`);

          try {
            transport = await transportP;
            transport.on("disconnect", () => ws.close());
            log("proxy", `WS(${index}): opened!`);
            ws.send(JSON.stringify({ type: "opened" }));
          } catch (e) {
            log("proxy", `WS(${index}): open failed!`, e);
            ws.send(JSON.stringify({ error: (e as Error).message }));
            ws.close();
          }

          return;
        }

        if (wsBusyIndex !== index) {
          console.warn("Ignoring message because transport is busy");
          return;
        }

        if (!transport) {
          console.warn("Received message before device was opened");
          return;
        }

        try {
          const response = await transport.exchange(Buffer.from(apduHex as string, "hex"));
          log("proxy", `WS(${index}): ${apduHex} => ${response.toString("hex")}`);
          if (!destroyed) {
            ws.send(JSON.stringify({ type: "response", data: response.toString("hex") }));
          }
        } catch (e) {
          log("proxy", `WS(${index}): ${apduHex} =>`, e);
          if (!destroyed) {
            ws.send(JSON.stringify({ type: "error", error: (e as Error).message }));
          }

          if ((e as Error).name === "RecordStoreWrongAPDU") {
            console.error((e as Error).message);
            process.exit(1);
          }
        }
      });
    });

    const proxyUrls = ["localhost", ...ips].map(ip => `ws://${ip}:${port || "8435"}`);
    proxyUrls.forEach(url => log("proxy", `DEVICE_PROXY_URL=${url}`));

    server.listen(port || "8435", () => {
      log("proxy", `\nNano S proxy started on ${ips[0]}\n`);
      observer.next(ips);
    });

    return () => {
      unsubscribe();
      wss.close(() => log("proxy", "WebSocket server closed."));
      server.close(() => log("proxy", "HTTP server closed."));
      console.warn(`Proxy stopped on ${port}`);
    };
  });
