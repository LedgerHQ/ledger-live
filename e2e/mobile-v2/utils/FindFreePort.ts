import net from "node:net";

export async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer({ allowHalfOpen: false });

    server.on("listening", () => {
      const address = server.address();
      if (address && typeof address !== "string") {
        const port: number = address.port;
        server.close(() => {
          resolve(port);
        });
      } else {
        resolve(8099);
      }
    });

    server.on("error", err => {
      reject(err);
    });

    server.listen(0);
  });
}
