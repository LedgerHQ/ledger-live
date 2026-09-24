import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { MockServer } from "../../testing/mock-server";
import { runCli } from "../../testing/cli-runner";
import { makeSessionDir } from "../../testing/session-fixture";
import { ETH_DESCRIPTOR } from "../../testing/constants";
import { ETH_SYNC_ROUTES } from "../../testing/eth-sync-routes";
import { KEYCLOAK_TOKEN, makeAuthRoutes } from "../../testing/auth-routes";
import { makeSwapQuoteRoutes } from "../../testing/swap-quote-routes";

describe("swap execute command — API auth", () => {
  const { routes, quoteAuthorizations } = makeSwapQuoteRoutes({ quote: { response: [] } });
  const server = new MockServer([...makeAuthRoutes(), ...ETH_SYNC_ROUTES, ...routes]);
  const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: ETH_DESCRIPTOR }]);

  beforeAll(() => server.start());
  afterAll(() => {
    server.stop();
    fixture.cleanup();
  });

  it("authenticates the quote request it runs before the device steps", async () => {
    // No quote comes back, so the command stops before it ever needs a device.
    const { exitCode, stdout } = await runCli(
      [
        "swap",
        "execute",
        "--account",
        "ethereum-1",
        "--to-account",
        "ethereum-1",
        "--from",
        "ethereum",
        "--to",
        "ethereum",
        "--amount",
        "0.001",
        "--provider",
        "uniswap",
        "--output",
        "json",
      ],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );

    expect(exitCode).toBe(1);
    expect(JSON.parse(stdout).error.message).toContain("No quote from 'uniswap'");
    expect(quoteAuthorizations).toEqual([`Bearer ${KEYCLOAK_TOKEN}`]);
  });
});
