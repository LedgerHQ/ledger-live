import "../../live-common-setup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import {
  AgentIntentHttpError,
  AgentIntentSdkError,
  type SwapIntent,
} from "@ledgerhq/agent-intent-sdk";
import { installOutputCapture } from "../../shared/ui";
import type { AgentSwapQuote } from "../../agent-intent/swap-quote";
import { toChecksumAddress } from "../../agent-intent/evm";
import type { SwapAsset, TokenCandidate } from "../../agent-intent/token-lookup";
import {
  activateAgentIntentMocks,
  deactivateAgentIntentMocks,
  realAgentIntentSdk,
} from "./__test-helpers__/agent-intent-mocks";

const agent = realAgentIntentSdk.createSoftwareAgentIdentity();
const SECRET_KEY = agent.exportSecretKey();

// EIP-55 specification vector, so the checksum is known-good.
const SENDER = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
const DEEPLINK = "https://app.agents.ledger-test.com/intents/intent-456";

const ETH: SwapAsset = { id: "ethereum", ticker: "ETH", decimals: 18 };
const USDC: SwapAsset = {
  id: "ethereum/erc20/usd__coin",
  ticker: "USDC",
  decimals: 6,
  contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
};
const DAI: SwapAsset = {
  id: "ethereum/erc20/dai_stablecoin_v2_0",
  ticker: "DAI",
  decimals: 18,
  contract: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
};
const DYDX: SwapAsset = {
  id: "ethereum/erc20/dydx",
  ticker: "DYDX",
  decimals: 18,
  contract: toChecksumAddress("0x92d6c1e31e14520e676a687f0a93788b716beff5"),
};
const PEPE = toChecksumAddress("0x6982508145454ce325ddbe47a25d4ec3d2311933");
const PEPE_COPY = toChecksumAddress("0xbe042e9d09cb588331ff911c2b46fd833a3e5bd6");

const usdc = {
  id: USDC.id,
  ticker: "USDC",
  name: "USD Coin",
  address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
};
const dai = {
  id: DAI.id,
  ticker: "DAI",
  name: "Dai Stablecoin v2.0",
  address: "0x6b175474e89094c44da98b954eedeac495271d0f",
};
const pepe = {
  id: "ethereum/erc20/pepe",
  ticker: "PEPE",
  name: "Pepe",
  address: PEPE.toLowerCase(),
};
const pepeCopy = {
  id: "ethereum/erc20/pepe_0xbe042e",
  ticker: "PEPE",
  name: "Pepe_0xbe042e",
  address: PEPE_COPY.toLowerCase(),
};
const dydx = {
  id: DYDX.id,
  ticker: "DYDX",
  name: "ethdYdX",
  address: "0x92d6c1e31e14520e676a687f0a93788b716beff5",
};
const etherToken = {
  id: "ethereum/erc20/ether_token",
  ticker: "ETH",
  name: "Ether Token",
  address: "0xc0829421c1d260bd3cb3e0f06cfe2d52db2ce315",
};
const bitcoinMeme = {
  id: "ethereum/erc20/harrypotterobamasonic10inu",
  ticker: "BITCOIN",
  name: "HarryPotterObamaSonic10Inu",
  address: "0x72e4f9f808c49a2a61de9c5896298920dc4eeea9",
};

const enrolledProfile = {
  profileId: "bot",
  displayName: "Bot",
  description: "Remote agent that proposes intents for review.",
  source: "openclaw",
  environment: "staging",
  bffBaseUrl: "https://global.api.stg.ledger-test.com/agent-intent",
  publicKey: agent.publicKey,
  trustchainId: "tc-1",
  enrollmentExpiresAt: new Date(Date.now() + 60_000).toISOString(),
  createdAt: new Date().toISOString(),
};

const accounts = [
  { label: "ethereum-1", descriptor: `account:2:address:ethereum:${SENDER}:m/44h/60h/0h/0/0` },
  {
    label: "bitcoin-native-1",
    descriptor:
      "account:2:utxo:bitcoin:xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz:m/84h/0h/0h",
  },
];

type QuoteRequest = {
  from: string;
  fromContract?: string;
  to: string;
  amount: string;
  sender: string;
  providers: string[];
};

let profiles: Record<string, unknown>;
let secretKeyReads: number;
let quoteImpl: (request: QuoteRequest) => Promise<AgentSwapQuote>;
let quoteRequests: QuoteRequest[];
let createSwapIntentImpl: (intent: SwapIntent) => Promise<string>;
let submittedIntents: SwapIntent[];
let clientOptions: Array<Record<string, unknown>>;
let makeClient: ((options: Record<string, unknown>) => unknown) | undefined;
let stdout: string[];
let stderr: string[];
let calTokens: TokenCandidate[];
let tickerLookups: string[];
let accountTokens: TokenCandidate[];
let accountTokensError: Error | undefined;
let accountReads: number;

beforeAll(() =>
  activateAgentIntentMocks({
    sessionRead: async () => ({
      accounts,
      getAgentIntentProfile: (id: string) => profiles[id],
    }),
    keychain: {
      loadAgentIntentSecretKey: async () => {
        secretKeyReads++;
        return SECRET_KEY;
      },
    },
    sdk: {
      createAgentIntentClient: (options: Record<string, unknown>) => {
        clientOptions.push(options);
        if (makeClient) return makeClient(options);
        return {
          publicKey: agent.publicKey,
          createSwapIntent: async (intent: SwapIntent) => {
            submittedIntents.push(intent);
            return createSwapIntentImpl(intent);
          },
        };
      },
    },
    tokenLookup: {
      findEthereumSwapAsset: async (id: string) =>
        [ETH, USDC, DAI, DYDX].find(asset => asset.id === id) ?? null,
      findTokensByTicker: async (network: string, ticker: string) => {
        tickerLookups.push(`${network} ${ticker}`);
        return calTokens.filter(
          token => token.ticker === ticker || token.ticker === ticker.toUpperCase(),
        );
      },
      findAccountTokens: async () => {
        accountReads++;
        if (accountTokensError) throw accountTokensError;
        return accountTokens;
      },
    },
    swapQuote: {
      fetchAgentSwapQuote: async (request: QuoteRequest) => {
        quoteRequests.push({ ...request, providers: [...request.providers] });
        return quoteImpl(request);
      },
    },
  }),
);
afterAll(() => deactivateAgentIntentMocks());

const { default: swapCommand } = await import("./swap");

type SwapFlags = {
  profile: string;
  account?: string;
  sender?: string;
  from: string;
  to: string;
  amount: string;
  provider?: string;
  "to-amount"?: string;
  description?: string;
  "dry-run": boolean;
  output?: "human" | "json";
};

function runSwap(overrides: Partial<SwapFlags> = {}) {
  const flags: SwapFlags = {
    profile: "bot",
    sender: SENDER,
    from: ETH.id,
    to: USDC.id,
    amount: "0.5",
    "dry-run": false,
    ...overrides,
  };
  return (
    swapCommand as unknown as { handler: (a: { flags: SwapFlags }) => Promise<void> }
  ).handler({ flags });
}

function jsonResult(): Record<string, unknown> {
  return JSON.parse(stdout.join("").trim().split("\n").at(-1) ?? "{}");
}

describe("agent-intent swap", () => {
  let restore: () => void;

  beforeEach(() => {
    profiles = { bot: enrolledProfile };
    secretKeyReads = 0;
    quoteImpl = async () => ({
      provider: "oneinch",
      receiveAmount: 1234.5678919,
      needsTokenApproval: false,
    });
    quoteRequests = [];
    createSwapIntentImpl = async () => DEEPLINK;
    submittedIntents = [];
    clientOptions = [];
    makeClient = undefined;
    stdout = [];
    stderr = [];
    calTokens = [usdc, dai, dydx, pepe, pepeCopy, etherToken, bitcoinMeme];
    tickerLookups = [];
    accountTokens = [];
    accountTokensError = undefined;
    accountReads = 0;
    restore = installOutputCapture({
      stdout: chunk => stdout.push(chunk),
      stderr: chunk => stderr.push(chunk),
    });
  });

  afterEach(() => restore());

  describe("quoted swap", () => {
    it("proposes the best quote's provider and receive amount, rounded down", async () => {
      await runSwap({ output: "json" });

      expect(quoteRequests).toEqual([
        {
          from: ETH.id,
          to: USDC.id,
          amount: "0.5",
          sender: SENDER,
          providers: ["oneinch", "velora", "okx", "lifi"],
        },
      ]);
      expect(submittedIntents).toEqual([
        {
          type: "swap",
          network: "ethereum",
          sender: SENDER,
          fromAsset: ETH.id,
          toAsset: USDC.id,
          fromAmount: "0.5",
          toAmount: "1234.567891",
          provider: "oneinch",
        },
      ]);
      expect(jsonResult()).toMatchObject({
        status: "success",
        command: "agent-intent swap",
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
      expect(stderr.join("")).not.toContain("approval");
    });

    it("quotes a token sale with its contract and proposes a quote that needs its approval", async () => {
      quoteImpl = async () => ({ provider: "okx", receiveAmount: 0.03, needsTokenApproval: true });

      await runSwap({ from: USDC.id, to: ETH.id, amount: "100", output: "json" });

      expect(quoteRequests).toEqual([
        expect.objectContaining({ from: USDC.id, fromContract: USDC.contract, to: ETH.id }),
      ]);
      expect(submittedIntents).toEqual([expect.objectContaining({ provider: "okx" })]);
      expect(jsonResult()).toMatchObject({ provider: "okx", needsTokenApproval: true });
      expect(stderr.join("")).toContain(
        "⚠ The okx quote needs a USDC approval first. The reviewer approves it in Agent Intent, " +
          "in a separate transaction with its own network fee, then reviews the swap.\n",
      );
    });

    it("authenticates with the profile's own identity, trustchain, BFF and environment", async () => {
      await runSwap();

      expect(clientOptions).toEqual([
        expect.objectContaining({
          bffBaseUrl: enrolledProfile.bffBaseUrl,
          trustchainId: "tc-1",
          environment: "staging",
          identity: expect.objectContaining({ publicKey: agent.publicKey }),
        }),
      ]);
    });

    it("quotes only the requested provider, accepting the 1inch spelling", async () => {
      await runSwap({ provider: "1inch" });

      expect(quoteRequests).toEqual([expect.objectContaining({ providers: ["oneinch"] })]);
    });

    it("rejects a provider the frontend can't prepare before quoting", async () => {
      await expect(runSwap({ provider: "uniswap" })).rejects.toThrow(
        /--provider "uniswap" can't be reviewed in the Agent Intent frontend yet/,
      );
      expect(quoteRequests).toEqual([]);
    });

    it("fails without proposing when the quote rounds to nothing", async () => {
      quoteImpl = async () => ({
        provider: "lifi",
        receiveAmount: 0.0000001,
        needsTokenApproval: false,
      });

      await expect(runSwap()).rejects.toThrow(
        "The lifi quote receives less than the smallest unit of USDC. Sell a larger --amount.",
      );
      expect(submittedIntents).toEqual([]);
    });

    it("surfaces a quote failure without proposing anything", async () => {
      quoteImpl = async () => {
        throw new Error("No swap quote available: lifi: no route.");
      };

      await expect(runSwap()).rejects.toThrow("No swap quote available: lifi: no route.");
      expect(secretKeyReads).toBe(0);
      expect(submittedIntents).toEqual([]);
    });

    it("shows the review link, the pair and says no transaction was signed or broadcast", async () => {
      await runSwap({ description: "Rebalance" });

      const printed = stdout.join("");
      expect(printed).toContain(DEEPLINK);
      expect(printed).toContain("no transaction was signed or broadcast");
      expect(printed).toContain("Sell:     0.5 ETH (ethereum)");
      expect(printed).toContain("Receive:  1234.567891 USDC (ethereum/erc20/usd__coin, quoted)");
      expect(printed).toContain("Provider: oneinch");
      expect(printed).toContain("Note:     Rebalance");
    });
  });

  describe("--to-amount", () => {
    it("signs the typed amount with the provider of a quote the frontend can prepare", async () => {
      quoteImpl = async () => ({
        provider: "velora",
        receiveAmount: 1234.5,
        needsTokenApproval: false,
      });

      await runSwap({ "to-amount": "1250.50", output: "json" });

      expect(quoteRequests).toEqual([
        expect.objectContaining({ providers: ["oneinch", "velora", "okx", "lifi"] }),
      ]);
      expect(submittedIntents).toEqual([
        expect.objectContaining({ toAmount: "1250.50", provider: "velora" }),
      ]);
      expect(jsonResult()).toMatchObject({ toAmount: "1250.50", quoted: false });
      expect(stderr.join("")).not.toContain("--to-amount");
    });

    it("warns on stderr, and still submits, when the amount is more than 5% above the quote", async () => {
      quoteImpl = async () => ({
        provider: "velora",
        receiveAmount: 1000,
        needsTokenApproval: false,
      });

      await runSwap({ "to-amount": "1050.01", output: "json" });

      expect(submittedIntents).toEqual([expect.objectContaining({ toAmount: "1050.01" })]);
      // stdout stays the one JSON envelope; the warning is on stderr only.
      const lines = stdout.join("").trim().split("\n");
      expect(lines).toHaveLength(1);
      expect(JSON.parse(lines[0]!)).toMatchObject({ toAmount: "1050.01", submitted: true });
      expect(stderr.join("")).toContain(
        "⚠ --to-amount 1050.01 USDC is more than 5% above the velora quote (1000 USDC); the reviewer will see a fresh quote, with your amount shown only as the proposal it replaced.\n",
      );
    });

    it("doesn't warn at exactly 5% above the quote", async () => {
      quoteImpl = async () => ({
        provider: "velora",
        receiveAmount: 1000,
        needsTokenApproval: false,
      });

      await runSwap({ "to-amount": "1050" });

      expect(stderr.join("")).not.toContain("--to-amount");
    });

    it("compares with the unrounded quote, not one rounded to the asset's precision", async () => {
      quoteImpl = async () => ({
        provider: "velora",
        receiveAmount: 1000.000000999,
        needsTokenApproval: false,
      });

      await runSwap({ "to-amount": "1050.000001" });

      expect(stderr.join("")).not.toContain("--to-amount");
    });

    it("says so when the quote rounds to nothing in the bought asset", async () => {
      quoteImpl = async () => ({
        provider: "lifi",
        receiveAmount: 0.0000001,
        needsTokenApproval: false,
      });

      await runSwap({ "to-amount": "1" });

      expect(stderr.join("")).toContain(
        "⚠ --to-amount 1 USDC is above the lifi quote, which rounds to nothing in USDC; the " +
          "reviewer will see a fresh quote, with your amount shown only as the proposal it replaced.\n",
      );
    });

    it("warns under --dry-run too", async () => {
      quoteImpl = async () => ({
        provider: "velora",
        receiveAmount: 1000,
        needsTokenApproval: false,
      });

      await runSwap({ "to-amount": "1050.01", "dry-run": true });

      expect(stderr.join("")).toContain(
        "⚠ --to-amount 1050.01 USDC is more than 5% above the velora quote (1000 USDC); the reviewer will see a fresh quote, with your amount shown only as the proposal it replaced.\n",
      );
      expect(submittedIntents).toEqual([]);
    });

    it("still refuses when no quote can be prepared", async () => {
      quoteImpl = async () => {
        throw new Error(
          "Every quote needs a Permit2 signature or a token approval the Agent Intent frontend " +
            "can't send.",
        );
      };

      await expect(runSwap({ "to-amount": "1250", provider: "okx" })).rejects.toThrow(
        /a token approval the Agent Intent frontend can't send/,
      );
      expect(quoteRequests).toEqual([expect.objectContaining({ providers: ["okx"] })]);
      expect(submittedIntents).toEqual([]);
    });

    it("rejects more decimals than the bought asset has, before quoting", async () => {
      await expect(runSwap({ "to-amount": "1250.0000001" })).rejects.toThrow(
        /more than 6 decimal places/,
      );
      expect(quoteRequests).toEqual([]);
    });
  });

  describe("--dry-run", () => {
    it("quotes and validates without reading the key or signing in", async () => {
      await runSwap({ "dry-run": true, output: "json" });

      expect(quoteRequests).toEqual([
        expect.objectContaining({ from: ETH.id, to: USDC.id, amount: "0.5" }),
      ]);
      expect(secretKeyReads).toBe(0);
      expect(clientOptions).toEqual([]);
      expect(jsonResult()).toMatchObject({
        toAmount: "1234.567891",
        submitted: false,
        dryRun: true,
      });
    });

    it("says a dry run's quote needs a token approval, in human output too", async () => {
      quoteImpl = async () => ({ provider: "okx", receiveAmount: 0.03, needsTokenApproval: true });

      await runSwap({ from: USDC.id, to: ETH.id, amount: "100", "dry-run": true });

      expect(stdout.join("")).toContain("Dry run — intent validated, nothing was submitted.");
      expect(stderr.join("")).toContain("⚠ The okx quote needs a USDC approval first.");
    });
  });

  describe("inputs", () => {
    it("resolves an account label to its address", async () => {
      await runSwap({ sender: undefined, account: "ethereum-1" });

      expect(submittedIntents).toEqual([expect.objectContaining({ sender: SENDER })]);
    });

    it("rejects a label on a network Agent Intent doesn't support", async () => {
      await expect(runSwap({ sender: undefined, account: "bitcoin-native-1" })).rejects.toThrow(
        /on bitcoin; this Agent Intent swap needs an Ethereum mainnet account/,
      );
    });

    it("requires exactly one of --account and --sender", async () => {
      const message = "Pass exactly one sender: --account <session-label> or --sender <address>.";
      await expect(runSwap({ sender: undefined })).rejects.toThrow(message);
      await expect(runSwap({ account: "ethereum-1" })).rejects.toThrow(message);
    });

    it("rejects a token id that isn't an Ethereum ERC-20", async () => {
      await expect(runSwap({ to: "polygon/erc20/usd__coin" })).rejects.toThrow(
        /--to "polygon\/erc20\/usd__coin" is not ethereum or an ERC-20 token on Ethereum mainnet/,
      );
      expect(quoteRequests).toEqual([]);
    });

    it("reads another chain's currency id as that id, never as the ticker of a token CAL lists", async () => {
      await expect(runSwap({ to: "bitcoin" })).rejects.toThrow(
        '--to "bitcoin" is the Bitcoin currency id, not an asset on Ethereum mainnet. A ticker ' +
          "typed in uppercase is looked up as an ERC-20 token instead.",
      );
      expect(tickerLookups).toEqual([]);
      expect(quoteRequests).toEqual([]);
    });

    it("looks up the uppercase spelling of another chain's currency id as an ERC-20 ticker", async () => {
      await runSwap({ to: "DYDX" });

      expect(submittedIntents).toEqual([expect.objectContaining({ toAsset: DYDX.id })]);
      expect(tickerLookups).toEqual(["ethereum DYDX"]);
    });

    it("rejects selling an asset for itself", async () => {
      await expect(runSwap({ to: ETH.id })).rejects.toThrow("--from and --to are the same asset.");
    });

    it("rejects an amount the service wouldn't accept, before quoting", async () => {
      await expect(runSwap({ amount: "1e18" })).rejects.toThrow(/is not a positive decimal amount/);
      await expect(runSwap({ amount: "0.0000000000000000001" })).rejects.toThrow(
        /more than 18 decimal places/,
      );
      expect(quoteRequests).toEqual([]);
    });

    it("rejects a profile that isn't enrolled", async () => {
      profiles = { bot: { ...enrolledProfile, trustchainId: undefined } };

      await expect(runSwap()).rejects.toThrow(/is not enrolled yet/);
    });
  });

  describe("tickers", () => {
    const stderrLines = () => stderr.join("").split("\n");

    it("takes the token the --account holds for a --from ticker, naming its currency id", async () => {
      accountTokens = [usdc];

      await runSwap({
        sender: undefined,
        account: "ethereum-1",
        from: "usdc",
        to: "ETH",
        amount: "100",
        output: "json",
      });

      expect(quoteRequests).toEqual([
        expect.objectContaining({ from: USDC.id, fromContract: USDC.contract, to: ETH.id }),
      ]);
      expect(submittedIntents).toEqual([
        expect.objectContaining({ fromAsset: USDC.id, toAsset: ETH.id, fromAmount: "100" }),
      ]);
      expect(jsonResult()).toMatchObject({ from: USDC, to: ETH });
      expect(tickerLookups).toEqual([]);
      expect(stderrLines()).toContain(
        `USDC is ${USDC.id} (USD Coin, ${USDC.contract}), held by "ethereum-1".`,
      );
    });

    it("takes the only ERC-20 CAL lists under a --to ticker for a --sender", async () => {
      await runSwap({ to: "USDC" });

      expect(submittedIntents).toEqual([expect.objectContaining({ toAsset: USDC.id })]);
      expect(tickerLookups).toEqual(["ethereum USDC"]);
      expect(stderrLines()).toContain(
        `USDC is ${USDC.id} (USD Coin, ${USDC.contract}), the only ERC-20 token with that ticker ` +
          "on Ethereum mainnet.",
      );
    });

    it("takes a --from ticker from the --account's tokens and a --to ticker from CAL", async () => {
      accountTokens = [usdc, dai];

      await runSwap({
        sender: undefined,
        account: "ethereum-1",
        from: "USDC",
        to: "DAI",
        amount: "100",
      });

      expect(submittedIntents).toEqual([
        expect.objectContaining({ fromAsset: USDC.id, toAsset: DAI.id }),
      ]);
      expect(accountReads).toBe(1);
      expect(tickerLookups).toEqual(["ethereum DAI"]);
    });

    it("never takes a --to token from the --account, so a copy it holds can't stand in", async () => {
      accountTokens = [pepeCopy];

      await expect(
        runSwap({ sender: undefined, account: "ethereum-1", to: "PEPE" }),
      ).rejects.toThrow("Several ERC-20 tokens on Ethereum mainnet have the ticker PEPE:");
      expect(accountReads).toBe(0);
      expect(quoteRequests).toEqual([]);
    });

    it("keeps ETH native, although CAL lists ERC-20 tokens with that ticker", async () => {
      await runSwap({ sender: undefined, account: "ethereum-1", from: "eth", to: USDC.id });

      expect(submittedIntents).toEqual([
        expect.objectContaining({ fromAsset: ETH.id, toAsset: USDC.id }),
      ]);
      expect(tickerLookups).toEqual([]);
      expect(accountReads).toBe(0);
    });

    it("falls back to CAL, saying why on stderr, when it can't read the --account's tokens", async () => {
      accountTokensError = new Error("RPC unreachable");

      await runSwap({
        sender: undefined,
        account: "ethereum-1",
        from: "USDC",
        to: "ETH",
        amount: "1",
      });

      expect(submittedIntents).toEqual([expect.objectContaining({ fromAsset: USDC.id })]);
      expect(tickerLookups).toEqual(["ethereum USDC"]);
      expect(stderrLines()).toContain(
        'Couldn\'t read the tokens account "ethereum-1" holds (RPC unreachable), so USDC is ' +
          "looked up in the Crypto Assets List instead.",
      );
    });

    it("lists the currency ids of the tokens the --account holds with a --from ticker", async () => {
      accountTokens = [pepe, pepeCopy];

      await expect(
        runSwap({ sender: undefined, account: "ethereum-1", from: "PEPE", to: "ETH", amount: "1" }),
      ).rejects.toThrow(
        'Account "ethereum-1" holds several ERC-20 tokens with the ticker PEPE:\n' +
          `  ethereum/erc20/pepe (Pepe, ${PEPE})\n` +
          `  ethereum/erc20/pepe_0xbe042e (Pepe_0xbe042e, ${PEPE_COPY})\n` +
          "Pass the currency id of the one to sell with --from.",
      );
      expect(quoteRequests).toEqual([]);
    });

    it("lists the currency ids when CAL has several tokens with a --to ticker", async () => {
      await expect(runSwap({ to: "PEPE" })).rejects.toThrow(
        "Several ERC-20 tokens on Ethereum mainnet have the ticker PEPE:\n" +
          `  ethereum/erc20/pepe (Pepe, ${PEPE})\n` +
          `  ethereum/erc20/pepe_0xbe042e (Pepe_0xbe042e, ${PEPE_COPY})\n` +
          "Pass the currency id of the one to buy with --to.",
      );
      expect(quoteRequests).toEqual([]);
    });

    it("refuses a ticker CAL doesn't list, pointing to the currency id", async () => {
      await expect(runSwap({ from: "XYZ" })).rejects.toThrow(
        "No ERC-20 token on Ethereum mainnet has the ticker XYZ in the Crypto Assets List, which " +
          "matches tickers case-sensitively (e.g. USDe, stETH). Check the ticker, or pass the " +
          "token's currency id with --from.",
      );
      expect(quoteRequests).toEqual([]);
    });

    it("rejects selling a token for itself, named once by ticker and once by currency id", async () => {
      await expect(runSwap({ from: "USDC", to: USDC.id, amount: "100" })).rejects.toThrow(
        "--from and --to are the same asset.",
      );
    });
  });

  describe("after submission", () => {
    it("maps a service rejection to an actionable message", async () => {
      createSwapIntentImpl = async () => {
        throw new AgentIntentHttpError("nonce reused", 409, "nonce_reused");
      };

      await expect(runSwap()).rejects.toThrow(/reused nonce/);
    });

    it("reports success without a review link instead of inviting a duplicate", async () => {
      createSwapIntentImpl = async () => {
        throw new AgentIntentSdkError("BFF returned an invalid intent deeplink.");
      };

      await runSwap({ output: "json" });

      expect(jsonResult()).toMatchObject({ deeplink: null, intentId: null, submitted: true });
      expect(stderr.join("")).toContain("don't re-run");
    });
  });

  describe("with the real SDK client", () => {
    it("posts a signed swap whose amounts are JSON strings", async () => {
      const bodies: string[] = [];
      makeClient = options =>
        realAgentIntentSdk.createAgentIntentClient({
          ...(options as Parameters<typeof realAgentIntentSdk.createAgentIntentClient>[0]),
          tokenProvider: realAgentIntentSdk.staticAccessTokenProvider("t"),
          fetch: (async (_url: unknown, init?: RequestInit) => {
            bodies.push(String(init?.body));
            return new Response("https://bff.example.com/intents/swap-1", { status: 201 });
          }) as typeof fetch,
        });

      await runSwap({ output: "json" });

      expect(bodies).toEqual([expect.stringContaining('"toAmount":"1234.567891"')]);
      expect(bodies.map(body => JSON.parse(body))).toEqual([
        expect.objectContaining({
          issuer: agent.publicKey,
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
        }),
      ]);
      expect(jsonResult()).toMatchObject({ intentId: "swap-1", submitted: true });
    });
  });
});
