import { once } from "events";
import fs from "fs";
import http from "http";
import type { AddressInfo } from "net";
import path from "path";
import { pipeline, Transform } from "stream";
import { setTimeout as sleep } from "timers/promises";

const feedDir = path.resolve(import.meta.dirname, "..", "..", "..", "dist", "feed");
const bytesPerMegabyte = 1024 * 1024;

export type FeedListeners = {
  onServe?: (file: string) => void;
  onSent?: (file: string) => void;
};

type ServeFeedOptions = FeedListeners & {
  downloadSpeed?: number;
  // Feed paths served from another file instead of the one in the feed.
  replacements?: ReadonlyMap<string, string>;
};

export async function serveFeed(options: ServeFeedOptions = {}) {
  const server = http.createServer((request, response) =>
    serveFeedFile(request, response, options),
  );
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const speed = options.downloadSpeed ? ` at ${options.downloadSpeed} MB/s` : "";
  console.log(`Serving ${feedDir} at ${url}${speed}`);
  return url;
}

function serveFeedFile(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  { onServe, onSent, downloadSpeed, replacements }: ServeFeedOptions,
) {
  const feedPath = path.basename(new URL(request.url ?? "/", "http://feed").pathname);
  const replacement = replacements?.get(feedPath);
  const file = replacement ?? path.join(feedDir, feedPath);
  const stats = fs.statSync(file, { throwIfNoEntry: false });
  const replaced = replacement ? " (replaced)" : "";
  console.log(`${request.method} ${request.url} ${stats?.isFile() ? 200 : 404}${replaced}`);
  if (!stats?.isFile()) {
    response.writeHead(404).end();
    return;
  }
  onServe?.(feedPath);
  response.writeHead(200, { "Content-Length": stats.size });
  const content = fs.createReadStream(file);
  const throttling = downloadSpeed ? [throttle(downloadSpeed * bytesPerMegabyte)] : [];
  pipeline([content, ...throttling, response], error => {
    if (!error) onSent?.(feedPath);
  });
}

function throttle(bytesPerSecond: number) {
  return new Transform({
    async transform(chunk: Buffer, _encoding, callback) {
      await sleep((chunk.length / bytesPerSecond) * 1000);
      callback(null, chunk);
    },
  });
}
