import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  spyOn,
  type Mock,
} from "bun:test";
import { buildAttestation } from "@ledgerhq/agent-intent-sdk";
import { toChecksumAddress } from "../../agent-intent/evm";
import {
  FakeAgentIntentService,
  makeEnrolledProfile,
  type EnrolledProfile,
} from "../../testing/agent-intent-service";
import {
  FakeCal,
  FakeSwapQuotes,
  holdingBalances,
  quoteRow,
  submittedIntents,
  type CalToken,
} from "../../testing/agent-intent-proposals";
import { useFreshCalCache } from "../../testing/cal-cache";
import { runCli } from "../../testing/cli-runner";
import { MockServer } from "../../testing/mock-server";
import { WalletAdapter } from "../../wallet";

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
// Ids as CAL gives them, since the process-wide CAL cache keeps what each test is answered.
const erc20 = (id: string, address: string, ticker: string, name: string): CalToken => ({
  id: `ethereum/erc20/${id}`,
  network: "ethereum",
  address: toChecksumAddress(address),
  ticker,
  name,
  decimals: 18,
});
const DAI = erc20(
  "dai_stablecoin_v2_0",
  "0x6b175474e89094c44da98b954eedeac495271d0f",
  "DAI",
  "Dai Stablecoin v2.0",
);
// ERC-20s whose ticker is also another chain's coin.
const DYDX = erc20("dydx", "0x92d6c1e31e14520e676a687f0a93788b716beff5", "DYDX", "ethdYdX");
const POL = erc20(
  "polygon_ecosystem_token",
  "0x455e53cbb86018ac2b8092fdcd39d8444affc3f6", // gitleaks:allow
  "POL",
  "Polygon Ecosystem Token",
);
const MNT = erc20("mantle", "0x3c3a81e81dc49a522a592e7622a7e711c06bf354", "MNT", "Mantle");
const BITCOIN_MEME = erc20(
  "harrypotterobamasonic10inu",
  "0x72e4f9f808c49a2a61de9c5896298920dc4eeea9",
  "BITCOIN",
  "HarryPotterObamaSonic10Inu",
);
const XRP_MEME = erc20(
  "harrypotterobamapacman8inu",
  `0x${"0".repeat(39)}2`,
  "XRP",
  "HarryPotterObamaPacMan8Inu",
);
const ETHER_TOKEN = erc20(
  "ether_token",
  "0xc0829421c1d260bd3cb3e0f06cfe2d52db2ce315", // gitleaks:allow
  "ETH",
  "Ether Token",
);
// Tickers differing only in case: mETH and a token CAL lists as METH.
const METH = erc20("meth", "0xd5f7838f5c461feff7fe49ea5ebaf7728bb0adfa", "mETH", "mETH");
const FARMING_BAD = erc20(
  "farming_bad",
  "0x11003e410ca3fcd220765b3d2f343433a0b2bffd",
  "METH",
  "Farming Bad",
);
// Two ERC-20s CAL lists under the PEPE ticker.
const PEPE = erc20("pepe", "0x6982508145454ce325ddbe47a25d4ec3d2311933", "PEPE", "Pepe");
const PEPE_COPY = erc20(
  "pepe_0xbe042e",
  "0xbe042e9d09cb588331ff911c2b46fd833a3e5bd6",
  "PEPE",
  "Pepe_0xbe042e",
);
// A lowercase namesake of USDC an account can hold, which CAL doesn't list.
const USDC_NAMESAKE = erc20("usdc_namesake", `0x${"0".repeat(39)}1`, "usdc", "usdc");
const USDC_TOKEN: CalToken = {
  ...USDC,
  network: "ethereum",
  address: USDC.contract,
  name: "USD Coin",
};

const SESSION_ACCOUNTS = [
  { label: "ethereum-1", descriptor: `account:2:address:ethereum:${SENDER}:m/44h/60h/0h/0/0` },
  { label: "bitcoin-native-1", descriptor: `account:2:utxo:bitcoin:${BTC_XPUB}:m/84h/0h/0h` },
];
const ALL_PROVIDERS = "oneinch,velora,okx,lifi";
const ABOVE_QUOTE_WARNING =
  "⚠ --to-amount 1050.01 USDC is more than 5% above the velora quote (1000 USDC); the " +
  "reviewer will see a fresh quote, with your amount shown only as the proposal it replaced.";

const service = new FakeAgentIntentService();
const quotes = new FakeSwapQuotes();
const cal = new FakeCal([
  USDC_TOKEN,
  { ...USDT, network: "ethereum", address: USDT.contract, name: "Tether USD" },
  DAI,
  DYDX,
  POL,
  MNT,
  BITCOIN_MEME,
  XRP_MEME,
  ETHER_TOKEN,
  METH,
  FARMING_BAD,
  PEPE,
  PEPE_COPY,
]);
const server = new MockServer([...service.routes, ...cal.routes, ...quotes.routes]);
let fixture: EnrolledProfile;
let env: Record<string, string>;
let restoreCalCache: () => void;
let accountBalances: Mock<WalletAdapter["getAccountBalances"]>;

beforeAll(async () => {
  server.start();
  fixture = await makeEnrolledProfile({ accounts: SESSION_ACCOUNTS });
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
  cal.reset();
  // The tokens a --account holds come from its sync; by default, none.
  accountBalances = spyOn(WalletAdapter.prototype, "getAccountBalances").mockResolvedValue(
    holdingBalances(),
  );
});
afterEach(() => {
  restoreCalCache();
  accountBalances.mockRestore();
});

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

const pair = (from: string, to: string, sender = ["--sender", SENDER]) => [
  ...sender,
  "--from",
  from,
  "--to",
  to,
  "--amount",
  "1",
];
const fromAccount = ["--account", "ethereum-1"];

/** Dry-runs the swap, so the resolved pair shows in its JSON and quote without submitting. */
async function resolve(...args: string[]) {
  quotes.answer(quoteRow("oneinch", 1));
  const { json, exitCode, stderr } = await swapJson(...args, "--dry-run");
  expect(exitCode, stderr).toBe(0);
  return { from: json.from.id, to: json.to.id, stderr };
}

async function refuse(...args: string[]) {
  const { json, exitCode } = await swapJson(...args);
  expect(exitCode).toBe(1);
  expect(quotes.queries).toEqual([]);
  expect(service.requests).toEqual([]);
  return json.error.message as string;
}

const anotherChainsCoin = (flag: "from" | "to", value: string, ticker = "that ticker") =>
  `--${flag} "${value}" is another chain's coin, not an asset on Ethereum mainnet. To ` +
  `${flag === "from" ? "sell" : "buy"} an ERC-20 token with ${ticker} instead, pass the ` +
  `token's currency id with --${flag}`;
const listed = (...tokens: CalToken[]) =>
  tokens.map(token => `  ${token.id} (${token.name}, ${token.address})`).join("\n");

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
    const keyless = await makeEnrolledProfile({ accounts: SESSION_ACCOUNTS });
    keyless.keychain.entries.clear();

    const { stdout, stderr, exitCode } = await runCli(
      ["agent-intent", "swap", "--profile", "bot", ...sellUsdc("--to-amount", "0.03", "--dry-run")],
      { ...keyless.env, WALLET_CLI_MOCK_PORT: String(server.port) },
    ).finally(keyless.cleanup);

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
    [
      ["--to", "polygon/erc20/usd__coin"],
      /--to "polygon\/erc20\/usd__coin" is not ethereum or an ERC-20 token on Ethereum mainnet/,
    ],
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

  describe("asset forms", () => {
    describe("other chains' coins", () => {
      it.each([
        ["bitcoin", "that ticker", [BITCOIN_MEME]],
        // By name in any case, never taking the one token CAL lists.
        ["bItCoIn", "that ticker", [BITCOIN_MEME]],
        // Only the currency id matches: the tokens under the coin's ticker are listed.
        ["ripple", "the ticker XRP", [XRP_MEME]],
        // An ERC-20 token has the ticker too.
        ["DYDX", "that ticker", [DYDX]],
        ["POL", "that ticker", [POL]],
        ["mnt", "that ticker", [MNT]],
      ])(
        "refuses --to %p, listing the ERC-20 tokens CAL has under it",
        async (to, ticker, tokens) => {
          expect(await refuse(...pair(ETH.id, to))).toBe(
            `${anotherChainsCoin("to", to, ticker)}:\n${listed(...tokens)}`,
          );
        },
      );

      it.each(["BSC", "ethereum_sepolia"])("refuses the currency id %p", async to => {
        expect(await refuse(...pair(ETH.id, to))).toStartWith(
          `--to "${to}" is another chain's coin, not an asset on Ethereum mainnet.`,
        );
      });

      it("refuses one to sell, without candidates when CAL lists none", async () => {
        expect(await refuse(...pair("SOL", ETH.id))).toBe(`${anotherChainsCoin("from", "SOL")}.`);
        expect(cal.tickerSearches).toEqual(["ethereum SOL"]);
      });

      it("still refuses one when CAL can't list its tokens", async () => {
        cal.failing = "tickers";

        expect(await refuse(...pair(ETH.id, "BTC"))).toBe(`${anotherChainsCoin("to", "BTC")}.`);
      });

      it("refuses one to sell when the --account holds no token with its ticker", async () => {
        accountBalances.mockResolvedValue(holdingBalances(USDC_TOKEN));

        expect(await refuse(...pair("DYDX", ETH.id, fromAccount))).toStartWith(
          `--from "DYDX" is another chain's coin, not an asset on Ethereum mainnet.`,
        );
        expect(accountBalances).toHaveBeenCalledTimes(1);
      });

      it.each([
        ["the POL", POL],
        ["the DYDX", DYDX],
      ])(
        "sells %s the --account holds, although another chain uses its ticker",
        async (_, token) => {
          accountBalances.mockResolvedValue(holdingBalances(token));

          expect(await resolve(...pair(token.ticker, ETH.id, fromAccount))).toMatchObject({
            from: token.id,
          });
          expect(cal.tickerSearches).toEqual([]);
        },
      );

      it("takes the ERC-20 token by its currency id", async () => {
        expect(await resolve(...pair(ETH.id, DYDX.id))).toMatchObject({ to: DYDX.id });
      });

      it("looks a testnet's name up as a ticker, matching only mainnet coins by name", async () => {
        expect(await refuse(...pair(ETH.id, "Ethereum Sepolia"))).toStartWith(
          "No ERC-20 token on Ethereum mainnet has the ticker Ethereum Sepolia in the Crypto " +
            "Assets List.",
        );
      });

      it("takes USDC as the ERC-20 token, although other chains use it as their coin's ticker", async () => {
        expect(await resolve(...pair(ETH.id, "usdc"))).toMatchObject({ to: USDC.id });
      });

      it("reads the Ethereum name as native ether, never as a token CAL lists", async () => {
        expect(await resolve(...pair("Ethereum", USDC.id))).toMatchObject({
          from: ETH.id,
          to: USDC.id,
        });
        expect(cal.tickerSearches).toEqual([]);
      });
    });

    describe("contract addresses", () => {
      it("takes one as the token CAL knows at it, without a ticker search", async () => {
        expect(await resolve(...pair(ETH.id, USDC.contract.toLowerCase()))).toMatchObject({
          to: USDC.id,
        });
        expect(cal.tickerSearches).toEqual([]);
      });

      it("rejects one CAL doesn't know, without a ticker search", async () => {
        const unknown = `0x${"1".repeat(40)}`;

        expect(await refuse(...pair(unknown, ETH.id))).toBe(
          `--from "${unknown}" is not ethereum or an ERC-20 token on Ethereum mainnet. Use a ` +
            "ticker such as ETH or USDC, a Ledger currency id such as ethereum/erc20/usd__coin, " +
            "or the token's contract address.",
        );
        expect(cal.tickerSearches).toEqual([]);
      });

      it("rejects one with a mistyped checksum", async () => {
        const mistyped = USDC.contract.replace("0xA0b8", "0xa0B8");

        expect(await refuse(...pair(ETH.id, mistyped))).toContain(
          `--to "${mistyped}" has an invalid EIP-55 checksum`,
        );
        expect(cal.tickerSearches).toEqual([]);
      });
    });

    describe("tickers", () => {
      it("takes the token the --account holds for --from, naming its currency id", async () => {
        accountBalances.mockResolvedValue(holdingBalances(USDC_TOKEN));

        const { stderr, ...resolved } = await resolve(...pair("usdc", ETH.id, fromAccount));

        expect(resolved).toEqual({ from: USDC.id, to: ETH.id });
        expect(quotes.queries[0]?.get("from")).toBe(USDC.id);
        expect(cal.tickerSearches).toEqual([]);
        expect(stderr).toContain(
          `USDC is ${USDC.id} (USD Coin, ${USDC.contract}), held by "ethereum-1".`,
        );
      });

      it("takes the only ERC-20 CAL lists under a --to ticker for a --sender", async () => {
        const { stderr, ...resolved } = await resolve(...pair(ETH.id, "USDC"));

        expect(resolved).toEqual({ from: ETH.id, to: USDC.id });
        expect(cal.tickerSearches).toEqual(["ethereum USDC"]);
        expect(stderr).toContain(
          `USDC is ${USDC.id} (USD Coin, ${USDC.contract}), the only ERC-20 token with that ` +
            "ticker on Ethereum mainnet.",
        );
      });

      it("takes a --from ticker from CAL for a --sender, without reading any account", async () => {
        const { stderr, ...resolved } = await resolve(...pair("DAI", ETH.id));

        expect(resolved).toEqual({ from: DAI.id, to: ETH.id });
        expect(cal.tickerSearches).toEqual(["ethereum DAI"]);
        expect(accountBalances).not.toHaveBeenCalled();
        expect(stderr).toContain(
          `DAI is ${DAI.id} (Dai Stablecoin v2.0, ${DAI.address}), the only ERC-20 token with ` +
            "that ticker on Ethereum mainnet.",
        );
      });

      it("takes --from from the --account's tokens and --to from CAL", async () => {
        accountBalances.mockResolvedValue(holdingBalances(USDC_TOKEN, DAI));

        expect(await resolve(...pair("USDC", "DAI", fromAccount))).toMatchObject({
          from: USDC.id,
          to: DAI.id,
        });
        expect(accountBalances).toHaveBeenCalledTimes(1);
        expect(cal.tickerSearches).toEqual(["ethereum DAI"]);
      });

      it("never takes --to from the --account, so a copy it holds can't stand in", async () => {
        accountBalances.mockResolvedValue(holdingBalances(PEPE_COPY));

        expect(await refuse(...pair(ETH.id, "PEPE", fromAccount))).toStartWith(
          "Several ERC-20 tokens on Ethereum mainnet have the ticker PEPE:",
        );
        expect(accountBalances).not.toHaveBeenCalled();
      });

      it("keeps ETH native, although CAL lists ERC-20 tokens with that ticker", async () => {
        expect(await resolve(...pair("eth", USDC.id, fromAccount))).toMatchObject({
          from: ETH.id,
        });
        expect(cal.tickerSearches).toEqual([]);
        expect(accountBalances).not.toHaveBeenCalled();
      });

      it("falls back to CAL, saying why, when it can't read the --account's tokens", async () => {
        accountBalances.mockRejectedValue(new Error("RPC unreachable"));

        const { stderr, ...resolved } = await resolve(...pair("USDC", ETH.id, fromAccount));

        expect(resolved).toMatchObject({ from: USDC.id });
        expect(cal.tickerSearches).toEqual(["ethereum USDC"]);
        expect(stderr).toContain(
          'Couldn\'t read the tokens account "ethereum-1" holds (RPC unreachable), so USDC is ' +
            "looked up in the Crypto Assets List instead.",
        );
      });

      it("takes a held mixed-case ticker spelled as typed over one matching in another case", async () => {
        accountBalances.mockResolvedValue(holdingBalances(FARMING_BAD, METH));

        expect(await resolve(...pair("mETH", ETH.id, fromAccount))).toMatchObject({
          from: METH.id,
        });
        expect(cal.tickerSearches).toEqual([]);
      });

      it.each([
        ["a held lowercase namesake, for --from usdc", [USDC_TOKEN, USDC_NAMESAKE], "usdc"],
        ["a held lowercase namesake, for --from USDC", [USDC_TOKEN, USDC_NAMESAKE], "USDC"],
        ["several held tokens with the ticker", [PEPE, PEPE_COPY], "PEPE"],
      ])("lists %s instead of selling either", async (_, held, from) => {
        accountBalances.mockResolvedValue(holdingBalances(...held));

        expect(await refuse(...pair(from, ETH.id, fromAccount))).toBe(
          `Account "ethereum-1" holds several ERC-20 tokens with the ticker ${from}:\n` +
            `${listed(...held)}\nPass the currency id of the one to sell with --from.`,
        );
      });

      it.each([
        ["PEPE", [PEPE, PEPE_COPY]],
        // mETH is listed next to the token CAL lists as METH.
        ["METH", [FARMING_BAD, METH]],
        ["meth", [FARMING_BAD, METH]],
      ])("lists the tokens CAL has under --to %p instead of buying one", async (to, tokens) => {
        expect(await refuse(...pair(ETH.id, to))).toBe(
          `Several ERC-20 tokens on Ethereum mainnet have the ticker ${to}:\n` +
            `${listed(...tokens)}\nPass the currency id of the one to buy with --to.`,
        );
      });

      it("buys mETH for --to mETH, over the token listed as METH", async () => {
        expect(await resolve(...pair(ETH.id, "mETH"))).toMatchObject({ to: METH.id });
      });

      it("says more tokens may have the --to ticker when CAL's search didn't finish", async () => {
        cal.failing = "search";

        expect(await refuse(...pair(ETH.id, "PEPE"))).toEndWith(
          `  ${PEPE_COPY.id} (Pepe_0xbe042e, ${PEPE_COPY.address})\n  … and maybe more\n` +
            "Pass the currency id of the one to buy with --to.",
        );
      });

      it("warns when CAL's search didn't finish for the only token with the --to ticker", async () => {
        cal.failing = "search";

        const { stderr, ...resolved } = await resolve(...pair(ETH.id, "DAI"));

        expect(resolved).toMatchObject({ to: DAI.id });
        expect(stderr).toContain(
          `DAI is ${DAI.id} (Dai Stablecoin v2.0, ${DAI.address}), the only ERC-20 token with ` +
            "that ticker on Ethereum mainnet. The Crypto Assets List search for its other letter " +
            "cases didn't finish, so another token may have it too.",
        );
      });

      it("refuses a ticker CAL doesn't list, pointing to the currency id", async () => {
        expect(await refuse(...pair("XYZ", ETH.id))).toBe(
          "No ERC-20 token on Ethereum mainnet has the ticker XYZ in the Crypto Assets List. " +
            "Check the ticker, or pass the token's currency id with --from.",
        );
      });

      it("rejects selling a token for itself, named once by ticker and once by currency id", async () => {
        expect(await refuse(...pair("USDC", USDC.id))).toBe("--from and --to are the same asset.");
      });
    });
  });
});
