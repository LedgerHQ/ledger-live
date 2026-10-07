import "../../live-common-setup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import {
  AgentIntentHttpError,
  AgentIntentSdkError,
  type SwapIntent,
} from "@ledgerhq/agent-intent-sdk";
import { installOutputCapture } from "../../shared/ui";
import type { AgentSwapQuote } from "../../agent-intent/swap-quote";
import type { SwapAsset } from "../../agent-intent/token-lookup";
import {
  activateAgentIntentMocks,
  deactivateAgentIntentMocks,
  realAgentIntentSdk,
} from "./__test-helpers__/agent-intent-mocks";

const agent = realAgentIntentSdk.createSoftwareAgentIdentity();
const SECRET_KEY = agent.exportSecretKey();

// EIP-55 specification vector, so the checksum is known-good.
const SENDER = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
const DEEPLINK = "https://agent-intent.ledger-test.com/intents/intent-456";

const ETH: SwapAsset = { id: "ethereum", ticker: "ETH", decimals: 18 };
const USDC: SwapAsset = { id: "ethereum/erc20/usd__coin", ticker: "USDC", decimals: 6 };

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
  { label: "ethereum-1", descriptor: `account:1:address:ethereum:main:${SENDER}:m/44h/60h/0h/0/0` },
  {
    label: "bitcoin-native-1",
    descriptor:
      "account:1:utxo:bitcoin:main:xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz:m/84h/0h/0h",
  },
];

type QuoteRequest = {
  from: string;
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
      findEthereumSwapAsset: async (id: string) => [ETH, USDC].find(a => a.id === id) ?? null,
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
    quoteImpl = async () => ({ provider: "oneinch", receiveAmount: 1234.5678919 });
    quoteRequests = [];
    createSwapIntentImpl = async () => DEEPLINK;
    submittedIntents = [];
    clientOptions = [];
    makeClient = undefined;
    stdout = [];
    stderr = [];
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
        submitted: true,
      });
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
      quoteImpl = async () => ({ provider: "lifi", receiveAmount: 0.0000001 });

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
    it("replaces the quote and keeps the amount exactly as typed", async () => {
      await runSwap({ "to-amount": "1250.50", provider: "velora", output: "json" });

      expect(quoteRequests).toEqual([]);
      expect(submittedIntents).toEqual([
        expect.objectContaining({ toAmount: "1250.50", provider: "velora" }),
      ]);
      expect(jsonResult()).toMatchObject({ toAmount: "1250.50", quoted: false });
    });

    it("needs --provider", async () => {
      await expect(runSwap({ "to-amount": "1250" })).rejects.toThrow(
        "--to-amount replaces the quote, so it needs --provider too.",
      );
    });

    it("rejects more decimals than the bought asset has", async () => {
      await expect(runSwap({ "to-amount": "1250.0000001", provider: "velora" })).rejects.toThrow(
        /more than 6 decimal places/,
      );
    });
  });

  describe("--dry-run", () => {
    it("quotes and validates without reading the key or signing in", async () => {
      await runSwap({ "dry-run": true, output: "json" });

      expect(quoteRequests).toHaveLength(1);
      expect(secretKeyReads).toBe(0);
      expect(clientOptions).toEqual([]);
      expect(jsonResult()).toMatchObject({
        toAmount: "1234.567891",
        submitted: false,
        dryRun: true,
      });
    });
  });

  describe("inputs", () => {
    it("resolves an account label to its address", async () => {
      await runSwap({ sender: undefined, account: "ethereum-1" });

      expect(submittedIntents).toEqual([expect.objectContaining({ sender: SENDER })]);
    });

    it("rejects a label on a network Agent Intent doesn't support", async () => {
      await expect(runSwap({ sender: undefined, account: "bitcoin-native-1" })).rejects.toThrow(
        /on bitcoin; Agent Intent swap intents support Ethereum mainnet accounts only/,
      );
    });

    it("requires exactly one of --account and --sender", async () => {
      await expect(runSwap({ sender: undefined })).rejects.toThrow(/exactly one sender/);
      await expect(runSwap({ account: "ethereum-1" })).rejects.toThrow(/exactly one sender/);
    });

    it("rejects an asset that isn't ETH or an Ethereum ERC-20", async () => {
      await expect(runSwap({ to: "bitcoin" })).rejects.toThrow(
        /--to "bitcoin" is not ethereum or an ERC-20 token on Ethereum mainnet/,
      );
      expect(quoteRequests).toEqual([]);
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

      const posted = JSON.parse(bodies[0]) as {
        issuer: string;
        nonce: string;
        intent: SwapIntent;
      };
      expect(posted.issuer).toBe(agent.publicKey);
      expect(posted.intent).toEqual({
        type: "swap",
        network: "ethereum",
        sender: SENDER.toLowerCase(),
        fromAsset: ETH.id,
        toAsset: USDC.id,
        fromAmount: "0.5",
        toAmount: "1234.567891",
        provider: "oneinch",
      });
      expect(bodies[0]).toContain('"toAmount":"1234.567891"');
      expect(jsonResult()).toMatchObject({ intentId: "swap-1", submitted: true });
    });
  });
});
