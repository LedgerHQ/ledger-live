/* eslint-disable no-console */
import { getEnv } from "@ledgerhq/live-common/lib/env";
import fs from "fs";
import { Observable } from "rxjs";
import WebSocket from "ws";


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
      const BOT_LOG_PROXY_FILE = getEnv("BOT_LOG_PROXY_FILE");

      if (!BOT_LOG_PROXY_FILE) {
        throw new Error("BOT_LOG_PROXY_FILE env is needed to save the logs");
      }

      const file = process.env.BOT_LOG_PROXY_FILE;
      if (!file) {
        console.error("BOT_LOG_PROXY_FILE env is needed to save the logs");
        process.exit(1);
      }
    
      const stream = fs.createWriteStream(file, { flags: "a" });
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
    }),
};
