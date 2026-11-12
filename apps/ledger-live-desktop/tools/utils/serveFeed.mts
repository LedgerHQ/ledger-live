import { once } from "events";
import fs from "fs";
import http from "http";
import type { AddressInfo } from "net";
import path from "path";

const feedDir = path.resolve(import.meta.dirname, "..", "..", "dist", "feed");

export async function serveFeed(onServe?: (file: string) => void) {
  const server = http.createServer((request, response) =>
    serveFeedFile(request, response, onServe),
  );
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  console.log(`Serving ${feedDir} at ${url}`);
  return url;
}

function serveFeedFile(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  onServe?: (file: string) => void,
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
  fs.createReadStream(file).pipe(response);
}
