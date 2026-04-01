import * as http from "http";
import * as https from "https";
import * as http2 from "http2";
import * as net from "net";
import * as tls from "tls";
import type { FaultConfig } from "./fault-injector";
import { applyLatency, shouldDropResponse, shouldInjectError } from "./fault-injector";
import { logger } from "../utils/logger";

export interface ProxyStats {
  totalRequests: number;
  errorsInjected: number;
  requestsDropped: number;
  requestsProxied: number;
}

const stats: ProxyStats = {
  totalRequests: 0,
  errorsInjected: 0,
  requestsDropped: 0,
  requestsProxied: 0,
};

export function resetProxyStats(): void {
  stats.totalRequests = 0;
  stats.errorsInjected = 0;
  stats.requestsDropped = 0;
  stats.requestsProxied = 0;
}

function parseUpstream(url: string): { host: string; port: number; useTls: boolean } {
  const parsed = new URL(url);
  const useTls = parsed.protocol === "https:";
  const port = parsed.port ? parseInt(parsed.port, 10) : useTls ? 443 : 80;
  return { host: parsed.hostname, port, useTls };
}

function defaultFault(): FaultConfig {
  return { latencyMs: 0, errorRate: 0, dropResponses: false };
}

/**
 * Creates a unified fault-injecting proxy that handles both:
 *
 * - HTTP/2 streams (gRPC from the native Rust engine via tonic)
 * - HTTP/1.1 requests (JSON-RPC from the TypeScript coin-bitcoin client)
 *
 * A single TCP server sniffs the first bytes of each connection: if they match
 * the HTTP/2 client preface ("PRI *…"), the socket is routed to an internal
 * http2 server; otherwise it goes to an http/1.1 server. Both share the same
 * fault-injection logic and stats.
 *
 * Listens on a random localhost port. Point either
 * `--zainoGrpcUrl http://localhost:{port}` or `--zainoUrl http://localhost:{port}`
 * at the returned port depending on which backend you are testing.
 */
export function createProxyServer(
  upstreamUrl: string,
  faultConfig?: FaultConfig,
): { server: net.Server; port: Promise<number>; getStats: () => ProxyStats } {
  const upstream = parseUpstream(upstreamUrl);
  const fault = faultConfig ?? defaultFault();

  // HTTP/2 preface — "PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n"
  // Checking the first 3 bytes ("PRI") is sufficient to distinguish from any
  // HTTP/1.1 method (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, CONNECT).
  const HTTP2_PREFACE_PREFIX = "PRI";

  // ── Sub-servers (never bound to a port — receive sockets via emit) ──────────
  const http2Server = http2.createServer();
  const http1Server = http.createServer();

  // ── HTTP/2 path (gRPC from native Rust engine) ──────────────────────────────
  http2Server.on("stream", async (clientStream, headers) => {
    stats.totalRequests++;
    await applyLatency(fault);

    if (shouldDropResponse(fault)) {
      stats.requestsDropped++;
      logger.warn({ path: headers[":path"] }, "gRPC stream dropped (fault injection)");
      clientStream.destroy();
      return;
    }

    if (shouldInjectError(fault)) {
      stats.errorsInjected++;
      logger.warn({ path: headers[":path"] }, "gRPC error injected (fault injection)");
      clientStream.respond({
        ":status": 200,
        "content-type": "application/grpc",
        "grpc-status": "2", // UNKNOWN
        "grpc-message": "injected fault",
      });
      clientStream.end();
      return;
    }

    stats.requestsProxied++;

    const upstreamSocket: net.Socket | tls.TLSSocket = upstream.useTls
      ? tls.connect({ host: upstream.host, port: upstream.port, servername: upstream.host })
      : net.connect({ host: upstream.host, port: upstream.port });

    const upstreamSession = http2.connect(upstreamUrl, { createConnection: () => upstreamSocket });

    upstreamSession.on("error", err => {
      logger.error({ err }, "gRPC upstream session error");
      if (!clientStream.destroyed) clientStream.destroy(err);
    });

    const upstreamStream = upstreamSession.request(headers, { endStream: false });

    upstreamStream.on("response", responseHeaders => {
      if (!clientStream.destroyed) clientStream.respond(responseHeaders);
    });

    upstreamStream.on("error", err => {
      logger.error({ err }, "gRPC upstream stream error");
      if (!clientStream.destroyed) clientStream.destroy(err);
    });

    upstreamStream.on("close", () => {
      if (!clientStream.destroyed) clientStream.end();
      upstreamSession.close();
    });

    clientStream.on("error", err => {
      logger.error({ err }, "gRPC client stream error");
      if (!upstreamStream.destroyed) upstreamStream.destroy(err);
    });

    clientStream.on("close", () => {
      if (!upstreamStream.destroyed) upstreamStream.end();
    });

    clientStream.pipe(upstreamStream);
    upstreamStream.pipe(clientStream, { end: false });
  });

  http2Server.on("error", err => logger.error({ err }, "http2 sub-server error"));

  // ── HTTP/1.1 path (JSON-RPC from TypeScript client) ─────────────────────────
  http1Server.on("request", async (req: http.IncomingMessage, res: http.ServerResponse) => {
    stats.totalRequests++;
    await applyLatency(fault);

    if (shouldDropResponse(fault)) {
      stats.requestsDropped++;
      logger.warn({ path: req.url }, "HTTP/1.1 request dropped (fault injection)");
      req.socket.destroy();
      return;
    }

    if (shouldInjectError(fault)) {
      stats.errorsInjected++;
      logger.warn({ path: req.url }, "HTTP/1.1 error injected (fault injection)");
      res.writeHead(500, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32603, message: "injected fault" },
          id: null,
        }),
      );
      return;
    }

    stats.requestsProxied++;

    const requestFn = upstream.useTls ? https.request : http.request;
    const proxyReq = requestFn(
      {
        host: upstream.host,
        port: upstream.port,
        path: req.url ?? "/",
        method: req.method,
        headers: { ...req.headers, host: upstream.host },
      },
      proxyRes => {
        res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
        proxyRes.pipe(res);
      },
    );

    proxyReq.on("error", err => {
      logger.error({ err }, "HTTP/1.1 upstream error");
      if (!res.headersSent) {
        res.writeHead(502);
        res.end();
      }
    });

    req.pipe(proxyReq);
  });

  http1Server.on("error", err => logger.error({ err }, "http1 sub-server error"));

  // ── TCP server with protocol sniffing ────────────────────────────────────────
  // Use `readable` + `socket.read()` in paused mode (never flowing) so that
  // `socket.unshift()` reliably puts the peeked bytes back before we hand the
  // socket off to the appropriate sub-server.
  const tcpServer = net.createServer(socket => {
    socket.once("readable", () => {
      const chunk: Buffer | null = socket.read(HTTP2_PREFACE_PREFIX.length);
      if (!chunk) {
        socket.destroy();
        return;
      }
      const isHttp2 = chunk.toString("ascii") === HTTP2_PREFACE_PREFIX;
      socket.unshift(chunk); // put peeked bytes back into the buffer
      if (isHttp2) {
        http2Server.emit("connection", socket);
      } else {
        http1Server.emit("connection", socket);
      }
    });

    socket.on("error", err => logger.error({ err }, "client socket error"));
  });

  tcpServer.on("error", err => logger.error({ err }, "proxy server error"));

  const port = new Promise<number>((resolve, reject) => {
    tcpServer.once("listening", () => {
      const address = tcpServer.address();
      if (!address || typeof address === "string") throw new Error("unexpected server address");
      const { port: boundPort } = address;
      logger.info({ port: boundPort, upstream: upstreamUrl }, "proxy server listening");
      resolve(boundPort);
    });
    tcpServer.once("error", reject);
    tcpServer.listen(0, "127.0.0.1");
  });

  return { server: tcpServer, port, getStats: () => ({ ...stats }) };
}
