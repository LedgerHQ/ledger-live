import { log, listen } from "@ledgerhq/logs";
import { open, registerTransportModule, TransportModule } from "@ledgerhq/live-common/hw/index";
import http from "http";
import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import WebSocket from "ws";
import bodyParser from "body-parser";
import os from "os";
import { Observable } from "rxjs";
import SpeculosHttpTransport, {
  SpeculosHttpTransportOpts,
} from "@ledgerhq/hw-transport-node-speculos-http";
import { retry } from "@ledgerhq/live-common/promise";
import { Buffer } from "buffer";
import { getEnv } from "@ledgerhq/live-env";
import invariant from "invariant";

let transport: TransportModule;

interface ProxyOptions {
  device: string;
  port: number;
  silent?: boolean;
  verbose?: boolean;
  speculosApiPort: number;
  speculosUrl: string;
}

export async function startProxy(
  proxyPort: number,
  speculosAddress?: string,
  speculosApiPort?: number,
): Promise<string> {
  if (!speculosApiPort) speculosApiPort = getEnv("SPECULOS_API_PORT");
  if (!speculosAddress) speculosAddress = "http://localhost";

  invariant(speculosApiPort, "E2E Proxy : speculosApiPort is not defined");

  return new Promise((resolve, reject) => {
    const options: ProxyOptions = {
      device: `speculos-${proxyPort}`,
      port: proxyPort,
      silent: true,
      verbose: false,
      speculosUrl: speculosAddress,
      speculosApiPort,
    };

    const observable = job(options);

    proxySubscriptions.set(speculosApiPort, {
      port: proxyPort,
      subscription: observable.subscribe({
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
    });
  });
}

export function closeProxy(apiPort?: number): number | undefined {
  if (!apiPort) {
    proxySubscriptions.forEach(sub => sub.subscription.unsubscribe());
    proxySubscriptions.clear();
    return;
  }

  const proxy = proxySubscriptions.get(apiPort);
  if (proxy) {
    proxy.subscription.unsubscribe();
    proxySubscriptions.delete(apiPort);
    return proxy.port;
  }
}

const job = ({ device, port, silent, verbose, speculosUrl, speculosApiPort }: ProxyOptions) =>
  new Observable(observer => {
    const req: SpeculosHttpTransportOpts = {
      apiPort: speculosApiPort.toString(),
      baseURL: speculosUrl,
    };

    transport = {
      id: `speculos-http-${speculosApiPort}`,
      open: id =>
        id.includes(port.toString()) ? retry(() => SpeculosHttpTransport.open(req)) : null,
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
    app.get("/", (_, res: Response) => {
      // you can ignore `next` if you don’t need it
      res.sendStatus(200);
    });

    let pending = false;
    app.post("/", bodyParser.json(), async (req: Request, res: Response) => {
      if (!req.body) {
        // don’t “return res…”, just send+return
        res.sendStatus(400);
        return;
      }

      if (pending) {
        res.status(400).json({ error: "An exchange query is already pending" });
        return;
      }

      pending = true;
      let data: Buffer | null = null;
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
        console.error(error?.message);
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

    server.listen(port, () => {
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
