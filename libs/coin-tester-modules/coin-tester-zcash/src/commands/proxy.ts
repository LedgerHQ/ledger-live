import type { CommandModule } from "yargs";
import { createProxyServer, resetProxyStats } from "../proxy/proxy-server";
import type { FaultConfig } from "../proxy/fault-injector";
import { logger } from "../utils/logger";

interface ProxyArgs {
  upstream: string;
  latency: number;
  errorRate: number;
  dropResponses: boolean;
}

export const proxyCommand: CommandModule<object, ProxyArgs> = {
  command: "proxy",
  describe:
    "Start a fault-injecting proxy for Zaino calls. Used for L3 fault injection tests. " +
    "Handles both HTTP/1.1 (JSON-RPC) and HTTP/2 (gRPC) on the same port. " +
    "Point --zainoUrl or --zainoGrpcUrl at http://localhost:{port} in bench/replay/record.",
  builder: yargs =>
    yargs
      .option("upstream", {
        type: "string",
        demandOption: true,
        describe: "Upstream Zaino URL to forward requests to (JSON-RPC or gRPC)",
      })
      .option("latency", {
        type: "number",
        default: 0,
        describe: "Added latency per request/stream in ms",
      })
      .option("errorRate", {
        type: "number",
        default: 0,
        describe: "Probability of injecting an error (0..1)",
      })
      .option("dropResponses", {
        type: "boolean",
        default: false,
        describe: "Randomly drop responses/streams to simulate timeouts",
      }),
  handler: async argv => {
    const faultConfig: FaultConfig = {
      latencyMs: argv.latency,
      errorRate: argv.errorRate,
      dropResponses: argv.dropResponses,
    };

    logger.info({ faultConfig, upstream: argv.upstream }, "Starting proxy");
    resetProxyStats();

    const { server, port: portPromise, getStats } = createProxyServer(argv.upstream, faultConfig);
    const port = await portPromise;

    logger.info(
      { localUrl: `http://localhost:${port}`, upstream: argv.upstream },
      "Proxy active — pass --zainoUrl http://localhost:" +
        port +
        " or --zainoGrpcUrl http://localhost:" +
        port +
        " to bench/replay/record",
    );
    logger.info("Press Ctrl+C to stop");

    const statsInterval = setInterval(() => {
      logger.info(getStats(), "proxy stats");
    }, 10_000);

    await new Promise<void>(resolve => {
      process.on("SIGINT", () => {
        clearInterval(statsInterval);
        server.close();
        logger.info(getStats(), "Final proxy stats");
        resolve();
      });
    });
  },
};
