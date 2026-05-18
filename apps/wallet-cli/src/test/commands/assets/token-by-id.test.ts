import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { MockServer } from "../../helpers/mock-server";
import { runCli } from "../../helpers/cli-runner";
import { USDT_CONTRACT, USDT_API_RESPONSE } from "../../helpers/cal-fixtures";

describe("assets token-by-id command", () => {
  const server = new MockServer([
    {
      method: "GET",
      match: /\/v1\/tokens.*id=/i,
      response: USDT_API_RESPONSE,
    },
  ]);

  beforeAll(() => server.start());
  afterAll(() => server.stop());

  it("human output: prints token details for a valid id", async () => {
    const { stdout, exitCode, stderr } = await runCli(
      ["assets", "token-by-id", "ethereum/erc20/usd_tether__erc20_"],
      { WALLET_CLI_MOCK_PORT: String(server.port) },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toContain("ethereum/erc20/usd_tether__erc20_");
    expect(stdout).toContain("USDT");
    expect(stdout).toContain(USDT_CONTRACT);
  });

  it("json output: returns a valid envelope", async () => {
    const { stdout, exitCode, stderr } = await runCli(
      ["assets", "token-by-id", "ethereum/erc20/usd_tether__erc20_", "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port) },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.status).toBe("success");
    expect(data.command).toBe("assets token-by-id");
    expect(data.network).toBe("ethereum");
    expect(data.token).toMatchObject({
      id: "ethereum/erc20/usd_tether__erc20_",
      ticker: "USDT",
      decimals: 6,
    });
  });

  it("exits non-zero when the id arg is missing", async () => {
    const { stdout, exitCode } = await runCli(["assets", "token-by-id", "--output", "json"], {
      WALLET_CLI_MOCK_PORT: String(server.port),
    });
    expect(exitCode).toBe(1);
    const err = JSON.parse(stdout);
    expect(err.ok).toBe(false);
    expect(err.error.message).toMatch(/Missing token id/i);
  });
});

describe("assets token-by-id command — not found", () => {
  const emptyServer = new MockServer([
    {
      method: "GET",
      match: /\/v1\/tokens.*id=/i,
      response: [],
    },
  ]);

  beforeAll(() => emptyServer.start());
  afterAll(() => emptyServer.stop());

  it("exits non-zero when the store returns no token", async () => {
    const { stdout, exitCode } = await runCli(
      ["assets", "token-by-id", "ethereum/erc20/nope", "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(emptyServer.port) },
    );
    expect(exitCode).toBe(1);
    const err = JSON.parse(stdout);
    expect(err.ok).toBe(false);
    expect(err.error.message).toMatch(/not found/i);
  });
});
