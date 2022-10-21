/* eslint-disable no-console */
import express, { json, urlencoded } from "express";
// import morgan from "morgan";
import SpeculosTransport from "@ledgerhq/hw-transport-node-speculos";
import {
  createSpeculosDevice,
  listAppCandidates,
  findAppCandidate,
  releaseSpeculosDevice,
} from "@ledgerhq/live-common/load/speculos";
import WebSocket from "ws";
import { getEnv } from "@ledgerhq/live-common/env";
import { generateMnemonic } from "bip39";
import { of } from "rxjs";

const devicesList: Record<string, SpeculosTransport> = {};
const clientList: Record<string, WebSocket> = {};

type MessageProxySpeculos =
  | {
      type: "exchange" | "open" | "button" | "apdu";
      data: string;
    }
  | { type: "error"; error: string };

const botSpeculosProxy = ({ port = 4377, wsPort = 8435 }) => {
  const app = express();
  app.use(json({ limit: "2000mb" }));
  app.use(urlencoded({ limit: "2000mb", extended: true }));
  const seed = getEnv("SEED");
  if (!seed) {
    throw new Error("SEED is not set");
  }
  const coinapps = getEnv("COINAPPS");
  if (!coinapps) {
    throw new Error("COINAPPS is not set");
  }

  const websocketServer = new WebSocket.Server({
    port: wsPort,
  });

  const sendToClient = (client: WebSocket | undefined, data: any) => {
    if (client) {
      client.send(data);
    }
  };

  const deleteClient = async (deviceId: string) => {
    clientList[deviceId]?.close();
    delete clientList[deviceId];
    await releaseSpeculosDevice(deviceId);
  };

  websocketServer.on("connection", (client, req) => {
    sendToClient(client, JSON.stringify({ message: "connected" }));

    const id = /[^/]*$/.exec(req.url || "")?.[0];
    if (!id) {
      return client.send(
        JSON.stringify({ type: "error", error: "id not found" })
      );
    }

    client.on("message", async (data) => {
      const message: MessageProxySpeculos = JSON.parse(data.toString());
      const device = devicesList[id];

      if (!device) {
        sendToClient(
          client,
          JSON.stringify({ type: "error", error: "device not found" })
        );
      }

      try {
        switch (message.type) {
          case "open":
            sendToClient(client, JSON.stringify({ type: "opened" }));
            break;

          case "exchange": {
            const res = await device.exchange(Buffer.from(message.data, "hex"));
            sendToClient(
              client,
              JSON.stringify({ type: "response", data: res })
            );
            break;
          }

          case "button":
            device.button(message.data);
            break;
        }
      } catch (e) {
        console.error(e);
        deleteClient(id);
        throw e;
      }
    });

    clientList[id] = client;

    client.on("close", () => {
      deleteClient(id);
    });
  });

  app.get("/health", (req, res) => {
    return res.status(200).send("OK");
  });

  app.post("/app-candidate", async (req, res) => {
    try {
      const appCandidates = await listAppCandidates(coinapps);
      const appCandidate = findAppCandidate(appCandidates, req.body);

      if (!appCandidate) {
        return res.status(404).send("No app candidate found");
      }

      return res.json(appCandidate);
    } catch (e: any) {
      console.error(e.message);
      return res.status(500).json({ error: e.message });
    }
  });

  app.post("/", async (req, res) => {
    try {
      const device = await createSpeculosDevice({
        ...req.body,
        seed: seed,
        coinapps: coinapps,
      });

      device.transport.automationSocket?.on("data", (data) => {
        const split = data.toString("ascii").split("\n");
        split
          .filter((ascii) => !!ascii)
          .forEach((ascii) => {
            const json = JSON.parse(ascii);
            sendToClient(
              clientList[device.id],
              JSON.stringify({ type: "screen", data: json })
            );
          });
      });

      device.transport.automationSocket?.on("error", (e) => {
        console.error("automationSocket error", e);
      });

      device.transport.apduSocket.on("error", (e) => {
        console.error("APDU ERROR", e);
      });

      device.transport.apduSocket.on("end", () => {
        if (clientList[device.id]) {
          sendToClient(
            clientList[device.id],
            JSON.stringify({ type: "close" })
          );
          deleteClient(device.id);
        }
      });

      device.transport.apduSocket.on("close", () => {
        if (clientList[device.id]) {
          sendToClient(
            clientList[device.id],
            JSON.stringify({ type: "close" })
          );
          deleteClient(device.id);
        }
      });

      devicesList[device.id] = device.transport;

      return res.json({ id: device.id });
    } catch (e: any) {
      console.error(e.message);
      return res.status(500).json({ error: e.message });
    }
  });

  app.delete("/:id", async (req, res) => {
    try {
      await releaseSpeculosDevice(req.params.id);

      return res.json(`${req.params.id} is destroyed`);
    } catch (e: any) {
      console.error(e.message);
      return res.status(500).json({ error: e.message });
    }
  });

  app.listen(port);
};


export default {
  description:
    "Run a bot test engine with speculos that automatically create accounts and do transactions",
  args: [
    {
      name: "port",
      alias: "p",
      type: String,
      desc: "specify the http port to use (default: 4377)",
    },
    {
      name: "wsPort",
      alias: "w",
      type: String,
      desc: "specify the websocket port to use (default: 8435)",
    },
    {
      name: "token",
      alias: "t",
      type: String,
      desc: "Token to restrict the access to http and webservices",
    },
  ],
  job: (arg: any) => {
    const SEED = getEnv("SEED");

    if (!SEED) {
      console.log(
        "You have not defined a SEED yet. Please use a new one SPECIFICALLY to this test and with NOT TOO MUCH funds. USE THIS BOT TO YOUR OWN RISK!\n" +
          "here is a possible software seed you can use:\n" +
          "SEED='" +
          generateMnemonic(256) +
          "'"
      );
      throw new Error("Please define a SEED env variable to run this bot.");
    }

    botSpeculosProxy(arg);
    return of<any>(
      `Proxy bot log is listening to port http ${arg.port ||
        4377} and ws ${arg.wsPort || 8435}`
    );
  },
};
