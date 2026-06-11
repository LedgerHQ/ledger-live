import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { MockServer } from "../../helpers/mock-server";
import { runCli } from "../../helpers/cli-runner";
import { USDT_CONTRACT, USDT_API_RESPONSE } from "../../helpers/cal-fixtures";

describe("assets token command", () => {
  const server = new MockServer([
    {
      method: "GET",
      match: /\/v1\/tokens.*contract_address=/i,
      response: USDT_API_RESPONSE,
    },
  ]);

  beforeAll(() => server.start());
  afterAll(() => server.stop());

  it("human output: prints the resolved Ledger token currency id", async () => {
    const { stdout, exitCode, stderr } = await runCli(
      ["assets", "token", "ethereum", USDT_CONTRACT],
      { WALLET_CLI_MOCK_PORT: String(server.port) },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toContain("ethereum/erc20/usd_tether__erc20_");
    expect(stdout).toContain("USDT");
    expect(stdout).toContain(USDT_CONTRACT);
  });

  it("json output: returns a valid envelope with the token payload", async () => {
    const { stdout, exitCode, stderr } = await runCli(
      ["assets", "token", "ethereum", USDT_CONTRACT, "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port) },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.status).toBe("success");
    expect(data.command).toBe("assets token");
    expect(data.network).toBe("ethereum");
    expect(data.token).toMatchObject({
      id: "ethereum/erc20/usd_tether__erc20_",
      ticker: "USDT",
      contractAddress: USDT_CONTRACT,
      parentCurrencyId: "ethereum",
      tokenType: "erc20",
      decimals: 6,
    });
  });

  it("exits non-zero with a clear error when the network is unknown", async () => {
    const { stdout, exitCode } = await runCli(
      ["assets", "token", "notanetwork", USDT_CONTRACT, "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port) },
    );
    expect(exitCode).toBe(1);
    const err = JSON.parse(stdout);
    expect(err.ok).toBe(false);
    expect(err.error.command).toBe("assets token");
    expect(err.error.message).toMatch(/Unknown network/i);
  });

  it("exits non-zero when the address arg is missing", async () => {
    const { stdout, exitCode } = await runCli(["assets", "token", "ethereum", "--output", "json"], {
      WALLET_CLI_MOCK_PORT: String(server.port),
    });
    expect(exitCode).toBe(1);
    const err = JSON.parse(stdout);
    expect(err.ok).toBe(false);
    expect(err.error.message).toMatch(/Missing address/i);
  });
});

describe("assets token command — not found", () => {
  const emptyServer = new MockServer([
    {
      method: "GET",
      match: /\/v1\/tokens.*contract_address=/i,
      response: [],
    },
  ]);

  beforeAll(() => emptyServer.start());
  afterAll(() => emptyServer.stop());

  it("exits non-zero with a 'not found' error when the store returns no token", async () => {
    const { stdout, exitCode } = await runCli(
      [
        "assets",
        "token",
        "ethereum",
        "0x0000000000000000000000000000000000000000",
        "--output",
        "json",
      ],
      { WALLET_CLI_MOCK_PORT: String(emptyServer.port) },
    );
    expect(exitCode).toBe(1);
    const err = JSON.parse(stdout);
    expect(err.ok).toBe(false);
    expect(err.error.command).toBe("assets token");
    expect(err.error.message).toMatch(/not found/i);
  });
});
