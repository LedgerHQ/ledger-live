import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { MockServer } from "../../helpers/mock-server";
import { runCli } from "../../helpers/cli-runner";

const SWAP_ID = "swap-123";
const PROVIDER = "exodus";

describe("swap status", () => {
  const server = new MockServer([
    {
      method: "POST",
      match: /\/swap\/status/,
      response: [{ provider: "exodus", swapId: SWAP_ID, status: "pending" }],
    },
  ]);

  beforeAll(() => server.start());
  afterAll(() => server.stop());

  it("human: success and shows normalized status", async () => {
    const { stdout, stderr, exitCode } = await runCli(
      ["swap", "status", "--swap-id", SWAP_ID, "--provider", PROVIDER],
      {
        WALLET_CLI_MOCK_PORT: String(server.port),
      },
    );
    expect(exitCode, stderr).toBe(0);
    expect(stdout).toContain("PENDING");
    expect(stdout).toContain(SWAP_ID);
  });

  it("json: success and core fields", async () => {
    const { stdout, stderr, exitCode } = await runCli(
      ["swap", "status", "--swap-id", SWAP_ID, "--provider", PROVIDER, "--output", "json"],
      {
        WALLET_CLI_MOCK_PORT: String(server.port),
      },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    const data = JSON.parse(stdout);
    expect(data.command).toBe("swap status");
    expect(data.network).toBe("swap");
    expect(data.swapId).toBe(SWAP_ID);
    expect(data.status).toBe("PENDING");
  });

  it("exits with code 1 when --provider is not on the allow-list", async () => {
    const { exitCode } = await runCli([
      "swap",
      "status",
      "--swap-id",
      SWAP_ID,
      "--provider",
      "unknown_provider",
    ]);
    expect(exitCode).toBe(1);
  });
});
