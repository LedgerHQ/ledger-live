import { describe, it, expect, beforeAll, afterAll, afterEach } from "bun:test";
import { MockServer } from "../helpers/mock-server";
import { runCli } from "../helpers/cli-runner";
import { makeSessionDir } from "../helpers/session-fixture";
import { ETH_ADDRESS, ETH_DESCRIPTOR } from "../helpers/constants";

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

const MOCK_PROVIDER_ROW = {
  name: "ParaSwap",
  partner_id: "paraswap",
  public_key: "1234567890abcdef",
  public_key_curve: "secp256k1" as const,
  service_app_version: 2,
  descriptor: {
    data: "09abcd",
    signatures: {
      prod: "a1b2c3",
      test: "d1e2f3",
    },
  },
};

describe("quote command", () => {
  const server = new MockServer([
    {
      method: "GET",
      match: /\/v1\/partners(\?|$)/,
      response: [MOCK_PROVIDER_ROW],
    },
    {
      method: "GET",
      match: /\/v1\/tokens(\?|$)/,
      response: [],
    },
    {
      method: "GET",
      match: /\/quote(\?|$)/,
      response: [MOCK_QUOTE_ROW],
    },
  ]);

  beforeAll(() => server.start());
  afterAll(() => server.stop());
  let sessionCleanup: (() => void) | undefined;
  afterEach(() => {
    sessionCleanup?.();
    sessionCleanup = undefined;
  });

  it("human output: prints quote summary", async () => {
    const { stdout, exitCode, stderr } = await runCli(
      [
        "swap",
        "quote",
        "--from",
        "ethereum",
        "--to",
        "bitcoin",
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
    expect(stdout).toMatch(/ethereum\s*→\s*bitcoin/i);
    expect(stdout).toMatch(/ethereum/i);
    expect(stdout).toMatch(/bitcoin/i);
    expect(stdout).toMatch(/paraswap/i);
  });

  it("json output: returns a valid swap quote envelope", async () => {
    const { stdout, exitCode, stderr } = await runCli(
      [
        "swap",
        "quote",
        "--from",
        "ethereum",
        "--to",
        "bitcoin",
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

  it("rejects swap currencies outside wallet-cli supported list", async () => {
    const { stdout, exitCode, stderr } = await runCli(
      [
        "swap",
        "quote",
        "--from",
        "dogecoin",
        "--to",
        "bitcoin",
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
    expect(exitCode, `stderr: ${stderr}`).toBe(1);
    const data = JSON.parse(stdout);
    expect(data.ok).toBe(false);
    expect(data.error.message).toContain("Unsupported swap from currency");
    expect(data.error.message).toContain("bitcoin, ethereum, solana");
  });

  it("can resolve source and destination addresses from session labels", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: ETH_DESCRIPTOR }]);
    sessionCleanup = fixture.cleanup;
    const { stdout, exitCode, stderr } = await runCli(
      [
        "swap",
        "quote",
        "--from",
        "ethereum",
        "--to",
        "bitcoin",
        "--from-account",
        "ethereum-1",
        "--to-account",
        "ethereum-1",
        "--amount",
        "0.1",
        "--output",
        "json",
      ],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.command).toBe("swap quote");
    expect(data.quotes[0].provider).toBe("paraswap");
  });
});
