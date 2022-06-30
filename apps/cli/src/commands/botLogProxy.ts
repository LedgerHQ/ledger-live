/* eslint-disable no-console */
import { getEnv } from "@ledgerhq/live-common/lib/env";
import fs from "fs";
import { Observable } from "rxjs";
import WebSocket from "ws";
import os from "os";

export default {
  description:
    "Run a bot test engine with speculos that automatically create accounts and do transactions",
  args: [
    {
      name: "port",
      alias: "p",
      type: String,
      desc: "specify the http port to use (default: 8331)",
    },
  ],
  job: (arg: any) =>
    new Observable(() => {
      const file = process.env.VERBOSE_FILE;
      if (!file) {
        console.error("VERBOSE_FILE env is needed to save the logs");
        process.exit(1);
      }

      const stream = fs.createWriteStream(file, { flags: "a" });
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

      const websocketServer = new WebSocket.Server({ port: arg.port || 8331 });

      websocketServer.on("connection", (client) => {
        client.on("message", async (data) => {
          const str = data.toString();
          const message = JSON.parse(str);
          if ((message?.type || "").startsWith("bot")) {
            // we're displaying to the CLI the most important logs which is the log of the bot
            console.log(message.message);
          }
          // we're saving it all
          stream.write(str + "\n");
        });
      });

      websocketServer.on("close", () => {
        console.log("disconnected");
      });

      console.log(`open in ${ips[0]}:${arg.port || 8331}\n`);
    }),
};
