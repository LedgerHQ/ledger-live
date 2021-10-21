/* eslint-disable global-require */
import {
  RecordStore,
  createTransportRecorder,
  openTransportReplayer,
} from "@ledgerhq/hw-transport-mocker";
import { log, listen } from "@ledgerhq/logs";
import { open } from "@ledgerhq/live-common/lib/hw";
import fs from "fs";
import http from "http";
import express from "express";
import cors from "cors";
import WebSocket from "ws";
import bodyParser from "body-parser";
import os from "os";
import { Observable } from "rxjs";
import { deviceOpt } from "../scan";
const args = [
  deviceOpt,
  {
    name: "file",
    alias: "f",
    type: String,
    desc: "in combination with --record, will save all the proxied APDUs to a provided file. If --record is not provided, proxy will start in replay mode of the provided file. If --file is not used at all, the proxy will just act as a proxy without saving the APDU.",
  },
  {
    name: "verbose",
    alias: "v",
    type: Boolean,
    desc: "verbose mode",
  },
  {
    name: "silent",
    alias: "s",
    type: Boolean,
    desc: "do not output the proxy logs",
  },
  {
    name: "disable-auto-skip",
    type: Boolean,
    desc: "auto skip apdu that don't replay instead of error",
  },
  {
    name: "port",
    alias: "p",
    type: String,
    desc: "specify the http port to use (default: 8435)",
  },
  {
    name: "record",
    alias: "r",
    type: Boolean,
    desc: "see the description of --file",
  },
];

const job = ({
  device,
  file,
  record,
  port,
  silent,
  verbose,
  "disable-auto-skip": noAutoSkip,
}) =>
  new Observable((o) => {
    const unsub = listen((l) => {
      if (verbose) {
        o.next(l.type + ": " + l.message);
      } else if (!silent && l.type === "proxy") {
        o.next(l.message);
      }
    });
    let Transport;
    let saveToFile = null;
    let recordStore;

    const getTransportLike = () => {
      return {
        open: () => open(device || ""),
        create: () => open(device || ""),
      };
    };

    // --file <file>
    // There are two ways to use the mock, either you record or you replay
    // record: using --record means that it's a decoration in node-hid that will just save to a file
    // replay: without --record, it's going to re-use a recorded file and mock a transport instead of using an actual device
    if (file) {
      if (record) {
        log("proxy", `the APDUs will be recorded in ${file}`);
        saveToFile = file;
        recordStore = new RecordStore([]);
        // FIXME: ok this is the funky part with `DecoratedTransport`, ignoring for now cuz it's bullshit typings
        // Has to be tackled during refacto
        // @ts-expect-error getTransportLike should return a Partial<Transport> and createTransportRecorder should accept it
        Transport = createTransportRecorder(getTransportLike(), recordStore);
      } else {
        recordStore = RecordStore.fromString(fs.readFileSync(file, "utf8"), {
          autoSkipUnknownApdu: !noAutoSkip,
        });

        if (recordStore.isEmpty()) {
          process.exit(0);
        }

        log(
          "proxy",
          `${recordStore.queue.length} mocked APDUs will be replayed from ${file}`
        );
        Transport = {
          open: () => openTransportReplayer(recordStore),
          create: () => openTransportReplayer(recordStore),
        };
      }
    } else {
      Transport = getTransportLike();
    }

    const ifaces = os.networkInterfaces();
    const ips = Object.keys(ifaces)
      .reduce(
        (acc, ifname) =>
          acc.concat(
            (ifaces[ifname] as any[]).map((iface) => {
              if (iface.family !== "IPv4" || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
              }

              return iface.address;
            })
          ),
        [] as any[]
      )
      .filter((a) => a);
    const PORT = port || "8435";
    const app = express();
    const server = http.createServer(app);
    const wss = new WebSocket.Server({
      server,
    });
    app.use(cors());
    app.get("/", (req, res) => {
      res.sendStatus(200);
    });

    if (recordStore) {
      app.post("/end", (req, res) => {
        try {
          if (!saveToFile) {
            recordStore.ensureQueueEmpty();
          }

          res.sendStatus(200);
          process.exit(0);
        } catch (e: any) {
          res.sendStatus(400);
          console.error(e.message);
          process.exit(1);
        }
      });
    }

    let pending = false;
    app.post("/", bodyParser.json(), async (req, res) => {
      if (!req.body) return res.sendStatus(400);
      let data = null;
      let error: Error | null = null;

      if (pending) {
        return res.status(400).json({
          error: "an exchange query was already pending",
        });
      }

      pending = true;

      try {
        const transport = await Transport.open();

        try {
          data = await transport.exchange(Buffer.from(req.body.apduHex, "hex"));
        } finally {
          transport.close();

          if (saveToFile) {
            fs.writeFileSync(saveToFile as any, recordStore.toString());
          } else if (recordStore) {
            if (recordStore.isEmpty()) {
              process.exit(0);
            }
          }
        }
      } catch (e: any) {
        error = e.toString();
      }

      pending = false;
      const result = {
        data,
        error,
      };

      if (data) {
        //  @ts-expect-error 3 args only, we give 5
        log("proxy", "HTTP:", req.body.apduHex, "=>", data.toString("hex"));
      } else {
        //  @ts-expect-error 3 args only, we give 5
        log("proxy", "HTTP:", req.body.apduHex, "=>", error);
      }

      res.json(result);

      if (error && error.name === "RecordStoreWrongAPDU") {
        console.error(error.message);
        process.exit(1);
      }
    });
    let wsIndex = 0;
    let wsBusyIndex = 0;
    wss.on("connection", (ws) => {
      const index = ++wsIndex;

      try {
        let transport;
        let transportP;
        let destroyed = false;

        const onClose = async () => {
          if (destroyed) return;
          destroyed = true;

          if (wsBusyIndex === index) {
            log("proxy", `WS(${index}): close`);
            await transportP.then(
              (t) => t.close(),
              () => {}
            );
            wsBusyIndex = 0;
          }

          if (saveToFile) {
            fs.writeFileSync(saveToFile as any, recordStore.toString());
          } else if (recordStore) {
            if (recordStore.isEmpty()) {
              process.exit(0);
            }
          }
        };

        ws.on("close", onClose);
        ws.on("message", async (apduHex) => {
          if (destroyed) return;

          if (apduHex === "open") {
            if (wsBusyIndex) {
              ws.send(
                JSON.stringify({
                  error: "WebSocket is busy (previous session not closed)",
                })
              );
              ws.close();
              destroyed = true;
              return;
            }

            transportP = Transport.open();
            wsBusyIndex = index;
            log("proxy", `WS(${index}): opening...`);

            try {
              transport = await transportP;
              transport.on("disconnect", () => ws.close());
              log("proxy", `WS(${index}): opened!`);
              ws.send(
                JSON.stringify({
                  type: "opened",
                })
              );
            } catch (e: any) {
              log("proxy", `WS(${index}): open failed! ${e}`);
              ws.send(
                JSON.stringify({
                  error: e.message,
                })
              );
              ws.close();
            }

            return;
          }

          if (wsBusyIndex !== index) {
            console.warn("ignoring message because busy transport");
            return;
          }

          if (!transport) {
            console.warn("received message before device was opened");
            return;
          }

          try {
            const res = await transport.exchange(
              Buffer.from(apduHex as string, "hex")
            );
            log("proxy", `WS(${index}): ${apduHex} => ${res.toString("hex")}`);
            if (destroyed) return;
            ws.send(
              JSON.stringify({
                type: "response",
                data: res.toString("hex"),
              })
            );
          } catch (e: any) {
            log("proxy", `WS(${index}): ${apduHex} =>`, e);
            if (destroyed) return;
            ws.send(
              JSON.stringify({
                type: "error",
                error: e.message,
              })
            );

            if (e.name === "RecordStoreWrongAPDU") {
              console.error(e.message);
              process.exit(1);
            }
          }
        });
      } catch (e) {
        ws.close();
      }
    });
    ["localhost", ...ips]
      .map((ip) => `ws://${ip}:${PORT}`)
      .forEach((ip) => {
        log("proxy", "DEVICE_PROXY_URL=" + ip);
      });
    server.listen(PORT, () => {
      log("proxy", `\nNano S proxy started on ${ips[0]}\n`);
    });
    return () => {
      unsub();
    };
  });

export default {
  args,
  job,
};
