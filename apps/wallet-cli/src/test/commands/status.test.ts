import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { MockServer } from "../helpers/mock-server";
import { runCli } from "../helpers/cli-runner";

const SWAP_ID = "swap-123";

describe("swap status", () => {
  const server = new MockServer([
    {
      method: "POST",
      match: /\/swap\/status/,
      response: [{ provider: "test", swapId: SWAP_ID, status: "pending" }],
    },
  ]);

  beforeAll(() => server.start());
  afterAll(() => server.stop());

  it("human: success and shows normalized status", async () => {
    const { stdout, stderr, exitCode } = await runCli(["swap", "status", "--swap-id", SWAP_ID], {
      WALLET_CLI_MOCK_PORT: String(server.port),
    });
    expect(exitCode, stderr).toBe(0);
    expect(stdout).toContain("PENDING");
    expect(stdout).toContain(SWAP_ID);
  });

  it("json: success and core fields", async () => {
    const { stdout, stderr, exitCode } = await runCli(
      ["swap", "status", "--swap-id", SWAP_ID, "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port) },
    );
    expect(exitCode, stderr).toBe(0);
    expect(JSON.parse(stdout)).toEqual(
      expect.objectContaining({
        swapId: SWAP_ID,
        status: "PENDING",
        updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      }),
    );
  });
});
