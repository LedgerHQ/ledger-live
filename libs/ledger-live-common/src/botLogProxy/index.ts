/* eslint-disable no-console */
import fs from "fs";
import WebSocket from "ws";

export const botProxyLog = (port?: number) => {
  const file = process.env.BOT_LOG_PROXY_FILE;
  if (!file) {
    console.error("BOT_LOG_PROXY_FILE env is needed to save the logs");
    process.exit(1);
  }

  const stream = fs.createWriteStream(file, { flags: "a" });
  const websocketServer = new WebSocket.Server({ port: port || 8331 });
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
    client.on("close", () => {
      // as soon as the client close. we assume the work is done and server closes.
      stream.end();
      websocketServer.close();
    });
  });
};
