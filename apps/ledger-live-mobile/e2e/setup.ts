import { device } from "detox";
import * as serverBridge from "./bridge/server";
import net from "net";

let port: number;

beforeAll(async () => {
  port = await findFreePort();
  await device.reverseTcpPort(8081);
  await device.reverseTcpPort(port);
  await device.reverseTcpPort(52619); // To allow the android emulator to access the dummy app
  await launchApp();
}, 2000000);

export async function launchApp() {
  serverBridge.close();
  serverBridge.init(port);
  await device.launchApp({
    launchArgs: { wsPort: port },
    languageAndLocale: {
      language: "en-US",
      locale: "en-US",
    },
  });
}

afterAll(async () => {
  serverBridge.close();
});

async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer({ allowHalfOpen: false });

    server.on("listening", () => {
      const address = server.address();
      if (address && typeof address !== "string") {
        const port: number = address.port;
        server.close(() => {
          resolve(port); // Resolve with the free port
        });
      } else {
        console.warn("Unable to determine port. Selecting default");
        resolve(8099); // Resolve with the free port
      }
    });

    server.on("error", err => {
      reject(err); // Reject with the error
    });

    server.listen(0); // Let the system choose an available port
  });
}
