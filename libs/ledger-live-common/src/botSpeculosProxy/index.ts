/* eslint-disable no-console */
import express, { json } from "express";
// import morgan from "morgan";
import SpeculosTransport from "@ledgerhq/hw-transport-node-speculos";
import {
  createSpeculosDevice,
  listAppCandidates,
  findAppCandidate,
  releaseSpeculosDevice,
} from "../load/speculos";
import WebSocket from "ws";
import "./log-setup";
import { getEnv } from "../env";

const devicesList: Record<string, SpeculosTransport> = {};
const clientList: Record<string, WebSocket> = {};

type MessageProxySpeculos =
  | {
      type: "exchange" | "open" | "button" | "apdu";
      data: string;
    }
  | { type: "error"; error: string };

const canAccess = (serverToken: string, receivedToken: string) => {
  if (serverToken === "" || !serverToken || receivedToken === serverToken) {
    return true;
  }

  return false;
};

export const botSpeculosProxy = ({ token, port = 4377, wsPort = 8435 }) => {
  const app = express();
  // app.use(morgan("tiny"));
  app.use(json());
  const seed = getEnv("SEED");
  if (!seed) {
    throw new Error("SEED is not set");
  }
  const coinapps = getEnv("COINAPPS");
  if (!coinapps) {
    throw new Error("COINAPPS is not set");
  }
  const speculosToken = token || getEnv("BOT_SPECULOS_PROXY_TOKEN");

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
            if (!canAccess(speculosToken, message.data)) {
              sendToClient(
                client,
                JSON.stringify({ type: "error", error: "not authorized" })
              );
              client.close();
            }
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

  app.post("/app-candidate", async (req, res) => {
    try {
      if (!canAccess(speculosToken, req.body.token)) {
        return res.status(401).send("not authorized");
      }
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
      if (!canAccess(speculosToken, req.body.token)) {
        return res.status(401).send("not authorized");
      }
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
      if (!canAccess(speculosToken, req.body.token)) {
        return res.status(401).send("not authorized");
      }
      await releaseSpeculosDevice(req.params.id);

      return res.json(`${req.params.id} is destroyed`);
    } catch (e: any) {
      console.error(e.message);
      return res.status(500).json({ error: e.message });
    }
  });

  app.listen(port);
};
