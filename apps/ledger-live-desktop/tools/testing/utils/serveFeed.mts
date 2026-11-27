import { once } from "events";
import fs from "fs";
import http from "http";
import type { AddressInfo } from "net";
import path from "path";
import { pipeline, Transform } from "stream";
import { setTimeout as sleep } from "timers/promises";

const feedDir = path.resolve(import.meta.dirname, "..", "..", "..", "dist", "feed");
const bytesPerMegabyte = 1024 * 1024;

export async function serveFeed(onServe?: (file: string) => void, downloadSpeed?: number) {
  const server = http.createServer((request, response) =>
    serveFeedFile(request, response, onServe, downloadSpeed),
  );
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const speed = downloadSpeed ? ` at ${downloadSpeed} MB/s` : "";
  console.log(`Serving ${feedDir} at ${url}${speed}`);
  return url;
}

function serveFeedFile(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  onServe?: (file: string) => void,
  downloadSpeed?: number,
) {
  const file = path.join(
    feedDir,
    path.basename(new URL(request.url ?? "/", "http://feed").pathname),
  );
  const stats = fs.statSync(file, { throwIfNoEntry: false });
  console.log(`${request.method} ${request.url} ${stats?.isFile() ? 200 : 404}`);
  if (!stats?.isFile()) {
    response.writeHead(404).end();
    return;
  }
  onServe?.(path.basename(file));
  response.writeHead(200, { "Content-Length": stats.size });
  const content = fs.createReadStream(file);
  const throttling = downloadSpeed ? [throttle(downloadSpeed * bytesPerMegabyte)] : [];
  pipeline([content, ...throttling, response], () => {});
}

function throttle(bytesPerSecond: number) {
  return new Transform({
    async transform(chunk: Buffer, _encoding, callback) {
      await sleep((chunk.length / bytesPerSecond) * 1000);
      callback(null, chunk);
    },
  });
}
