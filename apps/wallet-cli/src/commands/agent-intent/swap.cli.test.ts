import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { buildAttestation } from "@ledgerhq/agent-intent-sdk";
import {
  FakeAgentIntentService,
  makeEnrolledProfile,
  type EnrolledProfile,
} from "../../testing/agent-intent-service";
import {
  FakeCal,
  FakeSwapQuotes,
  quoteRow,
  submittedIntents,
} from "../../testing/agent-intent-proposals";
import { useFreshCalCache } from "../../testing/cal-cache";
import { runCli } from "../../testing/cli-runner";
import { MockServer } from "../../testing/mock-server";

// EIP-55 specification vector, so the checksum is known-good.
const SENDER = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
const BTC_XPUB =
  "xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz";
const DEEPLINK = "https://app.agents.ledger-test.com/intents/intent-456";
const ETH = { id: "ethereum", ticker: "ETH", decimals: 18 };
const USDC = {
  id: "ethereum/erc20/usd__coin",
  ticker: "USDC",
  decimals: 6,
  contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
};
const USDT = {
  id: "ethereum/erc20/usd_tether__erc20_",
  ticker: "USDT",
  decimals: 6,
  contract: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
};
const ALL_PROVIDERS = "oneinch,velora,okx,lifi";
const ABOVE_QUOTE_WARNING =
  "⚠ --to-amount 1050.01 USDC is more than 5% above the velora quote (1000 USDC); the " +
  "reviewer will see a fresh quote, with your amount shown only as the proposal it replaced.";

const service = new FakeAgentIntentService();
const quotes = new FakeSwapQuotes();
const cal = new FakeCal([
  { ...USDC, network: "ethereum", address: USDC.contract, name: "USD Coin" },
  { ...USDT, network: "ethereum", address: USDT.contract, name: "Tether USD" },
]);
const server = new MockServer([...service.routes, ...cal.routes, ...quotes.routes]);
let fixture: EnrolledProfile;
let env: Record<string, string>;
let restoreCalCache: () => void;

beforeAll(async () => {
  server.start();
  fixture = await makeEnrolledProfile({
    accounts: [
      { label: "ethereum-1", descriptor: `account:2:address:ethereum:${SENDER}:m/44h/60h/0h/0/0` },
      { label: "bitcoin-native-1", descriptor: `account:2:utxo:bitcoin:${BTC_XPUB}:m/84h/0h/0h` },
    ],
  });
  env = { ...fixture.env, WALLET_CLI_MOCK_PORT: String(server.port) };
});
afterAll(() => {
  fixture.cleanup();
  server.stop();
});
beforeEach(() => {
  restoreCalCache = useFreshCalCache();
  service.reset();
  quotes.reset();
});
afterEach(() => restoreCalCache());

function swap(...args: string[]) {
  return runCli(["agent-intent", "swap", "--profile", "bot", ...args], env);
}

async function swapJson(...args: string[]) {
  const run = await swap(...args, "--output", "json");
  return { ...run, json: JSON.parse(run.stdout) };
}

const sellEth = (...args: string[]) => [
  "--sender",
  SENDER,
  "--from",
  ETH.id,
  "--to",
  USDC.id,
  "--amount",
  "0.5",
  ...args,
];
const sellToken = (token: { id: string }, ...args: string[]) => [
  "--sender",
  SENDER,
  "--from",
  token.id,
  "--to",
  ETH.id,
  "--amount",
  "100",
  ...args,
];
const sellUsdc = (...args: string[]) => sellToken(USDC, ...args);

/** Sign-ins with the agent key; `swap` also signs in to the Swap API with its own key. */
const agentSignIns = () =>
  service.signIns.filter(signIn => signIn.publicKey === fixture.agent.publicKey);

describe("agent-intent swap (CLI)", () => {
  it("proposes the best quote, rounded down, signed by the profile's agent", async () => {
    quotes.answer(quoteRow("oneinch", 1234.5678919), quoteRow("velora", 1200));
    service.reply("createIntent", { text: "https://bff.example.com/intents/intent-456" });

    const { json, exitCode, stderr } = await swapJson(...sellEth());

    expect(exitCode, stderr).toBe(0);
    expect(json).toMatchObject({
      status: "success",
      command: "agent-intent swap",
      network: "ethereum",
      // The SDK rebases the service's link onto the environment's own frontend.
      intentId: "intent-456",
      deeplink: DEEPLINK,
      profileId: "bot",
      sender: SENDER,
      from: ETH,
      to: USDC,
      fromAmount: "0.5",
      toAmount: "1234.567891",
      provider: "oneinch",
      quoted: true,
      needsTokenApproval: false,
      submitted: true,
    });
    expect(submittedIntents(service)).toEqual([
      {
        issuer: fixture.agent.publicKey,
        signatureValid: true,
        intent: {
          type: "swap",
          network: "ethereum",
          sender: SENDER.toLowerCase(),
          fromAsset: ETH.id,
          toAsset: USDC.id,
          fromAmount: "0.5",
          toAmount: "1234.567891",
          provider: "oneinch",
        },
      },
    ]);
    expect(agentSignIns()).toEqual([
      {
        publicKey: fixture.agent.publicKey,
        attestation: buildAttestation(fixture.trustchainId),
        signatureValid: true,
      },
    ]);
    expect(quotes.queries.map(q => Object.fromEntries(q))).toEqual([
      expect.objectContaining({
        from: ETH.id,
        to: USDC.id,
        amountFrom: "0.5",
        addressFrom: SENDER,
        addressTo: SENDER,
        "providers-whitelist": ALL_PROVIDERS,
      }),
    ]);
    expect(stderr).not.toContain("approval");
  });

  it("shows the review link and the pair, and says nothing was signed or broadcast", async () => {
    quotes.answer(quoteRow("oneinch", 1234.5678919));
    service.reply("createIntent", { text: DEEPLINK });

    const { stdout } = await swap(...sellEth("--description", "Rebalance"));

    expect(stdout).toContain(DEEPLINK);
    expect(stdout).toContain("no transaction was signed or broadcast");
    expect(stdout).toContain("Sell:     0.5 ETH (ethereum)");
    expect(stdout).toContain(`Receive:  1234.567891 USDC (${USDC.id}, quoted)`);
    expect(stdout).toContain("Provider: oneinch");
    expect(stdout).toContain("Note:     Rebalance");
    expect(submittedIntents(service)[0]?.intent).toMatchObject({ description: "Rebalance" });
  });

  it("proposes a token sale whose quote needs an approval the frontend can send, and says so", async () => {
    quotes.answer(quoteRow("okx", 0.03, { approves: USDC.contract }));
    service.reply("createIntent", { text: DEEPLINK });

    const { json, stderr } = await swapJson(...sellUsdc());

    expect(json).toMatchObject({ provider: "okx", needsTokenApproval: true, submitted: true });
    expect(submittedIntents(service)[0]?.intent).toMatchObject({
      fromAsset: USDC.id,
      toAsset: ETH.id,
      provider: "okx",
    });
    expect(stderr).toContain(
      "⚠ Swapping USDC through okx needs an approval first. The reviewer approves it in " +
        "Agent Intent, in a separate transaction with its own network fee, then reviews the swap.",
    );
  });

  it("validates a dry run without the agent key, still saying the quote needs an approval", async () => {
    quotes.answer(quoteRow("okx", 0.03, { approves: USDC.contract }));

    const { stdout, stderr, exitCode } = await swap(
      ...sellUsdc("--to-amount", "0.03", "--dry-run"),
    );

    expect(exitCode, stderr).toBe(0);
    expect(stdout).toContain("Dry run — intent validated, nothing was submitted.");
    expect(stderr).toContain("⚠ Swapping USDC through okx needs an approval first.");
    expect(stderr).not.toContain("quote needs");
    expect(service.requests).toEqual([]);
    expect(agentSignIns()).toEqual([]);
  });

  it("reports a dry run as JSON with the quoted amount", async () => {
    quotes.answer(quoteRow("oneinch", 1234.5678919));

    const { json } = await swapJson(...sellEth("--dry-run"));

    expect(json).toMatchObject({ toAmount: "1234.567891", dryRun: true, submitted: false });
    expect(json).not.toHaveProperty("deeplink");
    expect(service.requests).toEqual([]);
  });

  it("quotes only the requested provider, accepting the 1inch spelling", async () => {
    quotes.answer(quoteRow("oneinch", 1000));

    await swap(...sellEth("--provider", "1inch", "--dry-run"));

    expect(quotes.queries.map(q => q.get("providers-whitelist"))).toEqual(["oneinch"]);
  });

  it("resolves an --account label to its address", async () => {
    quotes.answer(quoteRow("oneinch", 1000));

    const { json } = await swapJson(
      "--account",
      "ethereum-1",
      "--from",
      ETH.id,
      "--to",
      USDC.id,
      "--amount",
      "0.5",
      "--dry-run",
    );

    expect(json).toMatchObject({ sender: SENDER });
    expect(quotes.queries[0]?.get("addressFrom")).toBe(SENDER);
  });

  it("signs a --to-amount with the provider of a quote the frontend can prepare", async () => {
    quotes.answer(quoteRow("velora", 1234.5));
    service.reply("createIntent", { text: DEEPLINK });

    const { json, stderr } = await swapJson(...sellEth("--to-amount", "1250.50"));

    expect(quotes.queries[0]?.get("providers-whitelist")).toBe(ALL_PROVIDERS);
    expect(json).toMatchObject({ toAmount: "1250.50", provider: "velora", quoted: false });
    expect(submittedIntents(service)[0]?.intent).toMatchObject({
      toAmount: "1250.50",
      provider: "velora",
    });
    expect(stderr).not.toContain("--to-amount");
  });

  it("still submits a --to-amount far above the quote, warning on stderr only", async () => {
    quotes.answer(quoteRow("velora", 1000));
    service.reply("createIntent", { text: DEEPLINK });

    const { stdout, stderr } = await swapJson(...sellEth("--to-amount", "1050.01"));

    expect(stdout.split("\n")).toHaveLength(1);
    expect(JSON.parse(stdout)).toMatchObject({ toAmount: "1050.01", submitted: true });
    expect(stderr).toContain(ABOVE_QUOTE_WARNING);
  });

  it.each([
    ["more than 5% above", 1000, "1050.01", ABOVE_QUOTE_WARNING],
    ["exactly 5% above", 1000, "1050", null],
    // Compared with the unrounded quote, not one rounded to the asset's precision.
    ["within 5% of the unrounded", 1000.000000999, "1050.000001", null],
    [
      "above a quote that rounds to nothing in",
      0.0000001,
      "1",
      "⚠ --to-amount 1 USDC is above the velora quote, which rounds to nothing in USDC; the " +
        "reviewer will see a fresh quote, with your amount shown only as the proposal it replaced.",
    ],
  ])(
    "warns about a --to-amount %s the quote only when it should",
    async (_, quoted, typed, warning) => {
      quotes.answer(quoteRow("velora", quoted));

      const { stderr, exitCode } = await swap(...sellEth("--to-amount", typed, "--dry-run"));

      expect(exitCode, stderr).toBe(0);
      if (warning) expect(stderr).toContain(warning);
      else expect(stderr).not.toContain("--to-amount");
    },
  );

  it.each([
    [["--sender", "0x1234"], /--sender .*not an EVM address/],
    [
      ["--account", "bitcoin-native-1"],
      /on bitcoin; this Agent Intent swap needs an Ethereum mainnet account/,
    ],
    [["--account", "ethereum-9"], /No account labeled "ethereum-9"/],
    [[], /^Pass exactly one sender: --account <session-label> or --sender <address>\.$/],
    [["--account", "ethereum-1", "--sender", SENDER], /^Pass exactly one sender/],
  ])("rejects the sender %j before quoting", async (sender, message) => {
    const { json, exitCode } = await swapJson(
      ...sender,
      "--from",
      ETH.id,
      "--to",
      USDC.id,
      "--amount",
      "0.5",
    );

    expect(exitCode).toBe(1);
    expect(json.error.message).toMatch(message);
    expect(quotes.queries).toEqual([]);
  });

  it.each([
    [["--to", "bitcoin"], /--to "bitcoin" is not ethereum or an ERC-20 token on Ethereum mainnet/],
    [["--from", "ethereum/erc20/unknown"], /--from "ethereum\/erc20\/unknown" is not ethereum/],
    [["--to", ETH.id], /^--from and --to are the same asset\.$/],
    [["--amount", "1e18"], /--amount "1e18" is not a positive decimal amount/],
    [["--amount", "0"], /--amount "0" is not a positive decimal amount/],
    [["--amount", "0.0000000000000000001"], /more than 18 decimal places, the precision of ETH/],
    [["--to-amount", "1250.0000001"], /--to-amount 1250.0000001 has more than 6 decimal places/],
    [
      ["--provider", "uniswap"],
      /--provider "uniswap" can't be reviewed in the Agent Intent frontend yet/,
    ],
  ])("rejects %j before quoting", async (flags, message) => {
    const { json, exitCode } = await swapJson(...sellEth(), ...flags);

    expect(exitCode).toBe(1);
    expect(json.error.message).toMatch(message);
    expect(quotes.queries).toEqual([]);
    expect(service.requests).toEqual([]);
  });

  it("fails without proposing when the best quote rounds to nothing", async () => {
    quotes.answer(quoteRow("lifi", 0.0000001, { providerType: "CEX" }));

    const { json, exitCode } = await swapJson(...sellEth());

    expect(exitCode).toBe(1);
    expect(json.error.message).toBe(
      "The lifi quote receives less than the smallest unit of USDC. Sell a larger --amount.",
    );
    expect(service.requests).toEqual([]);
  });

  it("surfaces why no provider quoted, without proposing anything", async () => {
    quotes.answer({
      code: "NO_ROUTE",
      type: "float",
      provider: "lifi",
      message: "no route",
      parameter: {},
    });

    const { json, exitCode } = await swapJson(...sellEth());

    expect(exitCode).toBe(1);
    expect(json.error.message).toMatch(/^No swap quote available: .*lifi: no route\.$/);
    expect(service.requests).toEqual([]);
    expect(agentSignIns()).toEqual([]);
  });

  it.each([
    ["a Permit2 signature", USDC, quoteRow("oneinch", 0.03, { permit: true })],
    ["an approval of another token", USDC, quoteRow("okx", 0.03, { approves: SENDER })],
    [
      "an approval through a provider the frontend has no endpoint for",
      USDC,
      quoteRow("paraswap", 0.03, { approves: USDC.contract }),
    ],
    [
      "a USDT allowance reset",
      USDT,
      quoteRow("okx", 0.03, { approves: USDT.contract, approvedAmount: "5" }),
    ],
  ])("refuses a quote that needs %s the frontend can't send", async (_, sold, row) => {
    quotes.answer(row);

    const { json, exitCode } = await swapJson(...sellToken(sold, "--to-amount", "0.03"));

    expect(exitCode).toBe(1);
    expect(json.error.message).toMatch(
      /^Every quote needs a Permit2 signature or a token approval the Agent Intent frontend can't send/,
    );
    expect(service.requests).toEqual([]);
  });

  it("rejects a profile that is not enrolled", async () => {
    const pending = await makeEnrolledProfile({ profile: { trustchainId: undefined } });
    try {
      const { stdout, exitCode } = await runCli(
        ["agent-intent", "swap", "--profile", "bot", ...sellEth(), "--output", "json"],
        { ...pending.env, WALLET_CLI_MOCK_PORT: String(server.port) },
      );

      expect(exitCode).toBe(1);
      expect(JSON.parse(stdout).error.message).toMatch(/is not enrolled yet/);
      expect(quotes.queries).toEqual([]);
    } finally {
      pending.cleanup();
    }
  });

  it("turns a service rejection into an actionable message", async () => {
    quotes.answer(quoteRow("oneinch", 1000));
    service.reply("createIntent", {
      status: 409,
      json: { message: "nonce reused", type: "nonce_reused" },
    });

    const { json, exitCode } = await swapJson(...sellEth());

    expect(exitCode).toBe(1);
    expect(json.error.message).toMatch(/reused nonce/);
  });

  it("reports success without a review link instead of inviting a duplicate", async () => {
    quotes.answer(quoteRow("oneinch", 1000));
    service.reply("createIntent", { text: "not a link" });

    const { json, exitCode, stderr } = await swapJson(...sellEth());

    expect(exitCode).toBe(0);
    expect(json).toMatchObject({ deeplink: null, intentId: null, submitted: true });
    expect(stderr).toContain("don't re-run");
    expect(service.calls("createIntent")).toHaveLength(1);
  });
});
