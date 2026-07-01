import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, mock } from "bun:test";
import { MockServer } from "../helpers/mock-server";
import { makeSessionDir } from "../helpers/session-fixture";
import { ETH_DESCRIPTOR } from "../helpers/constants";
import { withMcpHarness } from "../helpers/mcp-runner";

// A single per-provider quote failure, matching the CLI `swap_quotes_unavailable` JSON envelope.
const PROVIDER_ERROR = {
  code: "PAIR_NOT_SUPPORTED",
  type: "float" as const,
  provider: "paraswap",
  message: "Pair not supported",
  parameter: { from: "ethereum", to: "bitcoin" },
};

// Force the "no quotes, but providers reported errors" branch of `swap quote`. The mock must be
// installed at module-eval time (before the lazily-loaded server graph binds `getQuotes`), so it
// is process-global and cannot be reliably un-mocked mid-run. To avoid leaking into other test
// files (e.g. the positive-path quote command tests that need the real HTTP-backed getQuotes), the
// override only fires when THIS test opts in via the env flag below; otherwise it delegates to the
// real implementation.
const FORCE_FLAG = "WALLET_CLI_TEST_FORCE_QUOTE_PROVIDER_ERROR";
const EXCHANGE_MODULE = "@ledgerhq/live-common/wallet-api/Exchange/index";
const exchangeActual = await import(EXCHANGE_MODULE);
const realGetQuotes = exchangeActual.getQuotes;
mock.module(EXCHANGE_MODULE, () => ({
  ...exchangeActual,
  getQuotes: (...args: Parameters<typeof realGetQuotes>) =>
    process.env[FORCE_FLAG] === "1"
      ? Promise.resolve({ quotes: [], providerErrors: [PROVIDER_ERROR], errors: [] })
      : realGetQuotes(...args),
}));

describe("mcp swap_quote — provider_errors reach the structured MCP error (parity with `--output json`)", () => {
  const server = new MockServer([]);
  beforeAll(() => server.start());
  afterAll(() => server.stop());

  let fixture: ReturnType<typeof makeSessionDir>;
  beforeEach(() => {
    fixture = makeSessionDir([{ label: "ethereum-1", descriptor: ETH_DESCRIPTOR }]);
  });
  afterEach(() => {
    fixture.cleanup();
    delete process.env[FORCE_FLAG];
  });

  it("swap_quotes_unavailable surfaces provider_errors, not just code/message", async () => {
    process.env[FORCE_FLAG] = "1";
    const env = { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env };
    const result = await withMcpHarness(env, ({ callTool }) =>
      callTool("swap_quote", {
        from: "ethereum",
        to: "bitcoin",
        "from-account": "ethereum-1",
        "to-account": "ethereum-1",
        amount: "0.1",
      }),
    );

    expect(result.isError).toBe(true);
    const err = result.structuredContent as Record<string, unknown>;
    expect(err.code).toBe("swap_quotes_unavailable");
    expect(err.exitCode).toBe(1);
    expect(err.provider_errors).toEqual([PROVIDER_ERROR]);
    // The text content block must carry the same payload as structuredContent.
    expect(result.data).toEqual(result.structuredContent);
  });
});
