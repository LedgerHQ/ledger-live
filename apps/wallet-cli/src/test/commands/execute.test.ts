import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { ETH_SYNC_ROUTES } from "../helpers/eth-sync-routes";
import { runCli } from "../helpers/cli-runner";
import { MockServer } from "../helpers/mock-server";
import { MOCK_ETH_DESCRIPTOR } from "../helpers/constants";

/**
 * Keep this file focused on CLI-level registration/validation. Pipeline wiring is
 * covered in apps/wallet-cli/src/commands/swap/execute.test.ts with explicit
 * dependency injection, so this test does not need process-wide Bun module mocks.
 */
describe("swap execute command", () => {
  const server = new MockServer(ETH_SYNC_ROUTES);

  beforeAll(() => server.start());
  afterAll(() => server.stop());

  it("json: exits 1 when --to-account is missing", async () => {
    const { exitCode, stderr } = await runCli(
      [
        "swap",
        "execute",
        "--provider",
        "changelly",
        "--amount",
        "0.001",
        "--account",
        MOCK_ETH_DESCRIPTOR,
        "--output",
        "json",
      ],
      { WALLET_CLI_MOCK_PORT: String(server.port) },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(1);
  });
});
