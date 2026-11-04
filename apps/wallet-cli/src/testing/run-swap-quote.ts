import { makeAuthRoutes } from "./auth-routes";
import { runCli } from "./cli-runner";
import { ETH_DESCRIPTOR } from "./constants";
import { MockServer } from "./mock-server";
import { makeSessionDir } from "./session-fixture";
import { SWAP_QUOTE_ARGS, makeSwapQuoteRoutes } from "./swap-quote-routes";

const quote = makeSwapQuoteRoutes();
const server = new MockServer([...makeAuthRoutes(), ...quote.routes]);
const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: ETH_DESCRIPTOR }]);
server.start();
try {
  const { exitCode } = await runCli([...SWAP_QUOTE_ARGS, "--output", "json"], {
    WALLET_CLI_MOCK_PORT: String(server.port),
    ...fixture.env,
  });
  console.log(JSON.stringify({ exitCode, quotePaths: quote.quotePaths }));
} finally {
  server.stop();
  fixture.cleanup();
}
