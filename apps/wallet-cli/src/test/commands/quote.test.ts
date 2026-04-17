import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { MockServer } from "../helpers/mock-server";
import { runCli } from "../helpers/cli-runner";
import { ETH_ADDRESS } from "../helpers/constants";

/** Minimal `RawQuote` row for `/quote` — enough for `normalizeQuote` + `buildQuoteDetails`. */
const MOCK_QUOTE_ROW = {
  type: "float" as const,
  provider: "paraswap",
  providerType: "DEX" as const,
  amountFrom: 0.1,
  amountTo: 0.05,
  exchangeRate: 3000,
  slippage: 0.5,
  networkFees: { currency: "ethereum", gasLimit: "21000" },
  tags: {
    isRegistrationRequired: false,
    isTokenApprovalRequired: false,
  },
  liquiditySource: "AMM" as const,
};

describe("quote command", () => {
  const server = new MockServer([
    {
      method: "GET",
      match: /\/quote(\?|$)/,
      response: [MOCK_QUOTE_ROW],
    },
  ]);

  beforeAll(() => server.start());
  afterAll(() => server.stop());

  it("human output: prints quote summary", async () => {
    const { stdout, exitCode, stderr } = await runCli(
      [
        "quote",
        "--from",
        "ETH",
        "--to",
        "BTC",
        "--from-fresh-address",
        ETH_ADDRESS,
        "--to-fresh-address",
        ETH_ADDRESS,
        "--amount",
        "0.1",
      ],
      { WALLET_CLI_MOCK_PORT: String(server.port) },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toMatch(/quote\(s\) received/);
    expect(stdout).toMatch(/ethereum/i);
    expect(stdout).toMatch(/bitcoin/i);
    expect(stdout).toMatch(/paraswap/i);
  });

  it("json output: returns a valid swap quote envelope", async () => {
    const { stdout, exitCode, stderr } = await runCli(
      [
        "quote",
        "--from",
        "ETH",
        "--to",
        "BTC",
        "--from-fresh-address",
        ETH_ADDRESS,
        "--to-fresh-address",
        ETH_ADDRESS,
        "--amount",
        "0.1",
        "--output",
        "json",
      ],
      { WALLET_CLI_MOCK_PORT: String(server.port) },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    const data = JSON.parse(stdout);
    expect(data.command).toBe("swap quote");
    expect(data.network).toBe("ethereum");
    expect(Array.isArray(data.quotes)).toBe(true);
    expect(data.quotes.length).toBeGreaterThanOrEqual(1);
    expect(data.quotes[0].provider).toBe("paraswap");
  });
});
