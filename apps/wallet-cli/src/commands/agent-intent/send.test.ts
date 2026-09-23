import "../../live-common-setup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { AgentIntentHttpError, type SendIntent } from "@ledgerhq/agent-intent-sdk";
import { installOutputCapture } from "../../shared/ui";
import { toChecksumAddress } from "../../agent-intent/evm";
import { AgentIntentCorruptKeychainError } from "../../key-ring/agent-intent-keychain";
import {
  activateAgentIntentMocks,
  deactivateAgentIntentMocks,
  realAgentIntentSdk,
} from "./__test-helpers__/agent-intent-mocks";

const agent = realAgentIntentSdk.createSoftwareAgentIdentity();
const SECRET_KEY = agent.exportSecretKey();
const OTHER_AGENT = realAgentIntentSdk.createSoftwareAgentIdentity();

// EIP-55 specification vectors, so checksums are known-good.
const SENDER = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
const RECIPIENT = "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359";
const USDC = toChecksumAddress("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");

const DEEPLINK = "https://agent-intent.ledger-test.com/intents/intent-123";

const enrolledProfile = {
  profileId: "bot",
  displayName: "Bot",
  description: "Remote agent that proposes intents for review.",
  source: "openclaw",
  environment: "staging",
  bffBaseUrl: "https://bff.example.com/agent-intent",
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

let profiles: Record<string, unknown>;
let secretKeyImpl: () => Promise<string | null>;
let secretKeyReads: number;
let createSendIntentImpl: (intent: SendIntent) => Promise<string>;
let submittedIntents: SendIntent[];
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
        return secretKeyImpl();
      },
    },
    sdk: {
      createAgentIntentClient: (options: Record<string, unknown>) => {
        clientOptions.push(options);
        if (makeClient) return makeClient(options);
        return {
          publicKey: agent.publicKey,
          createSendIntent: async (intent: SendIntent) => {
            submittedIntents.push(intent);
            return createSendIntentImpl(intent);
          },
        };
      },
    },
    tokenLookup: {
      findEthereumToken: async (contract: string) =>
        contract.toLowerCase() === USDC.toLowerCase()
          ? { ticker: "USDC", decimals: 6, contract: USDC }
          : null,
    },
  }),
);
afterAll(() => deactivateAgentIntentMocks());

const { default: sendCommand } = await import("./send");

type SendFlags = {
  profile: string;
  account?: string;
  from?: string;
  to: string;
  amount: string;
  token?: string;
  "fee-strategy": "slow" | "medium" | "fast";
  description?: string;
  "dry-run": boolean;
  output?: "human" | "json";
};

function runSend(overrides: Partial<SendFlags> = {}) {
  const flags: SendFlags = {
    profile: "bot",
    from: SENDER,
    to: RECIPIENT,
    amount: "0.01 ETH",
    "fee-strategy": "medium",
    "dry-run": false,
    ...overrides,
  };
  return (
    sendCommand as unknown as { handler: (a: { flags: SendFlags }) => Promise<void> }
  ).handler({ flags });
}

function jsonResult(): Record<string, unknown> {
  return JSON.parse(stdout.join("").trim().split("\n").at(-1) ?? "{}");
}

describe("agent-intent send", () => {
  let restore: () => void;

  beforeEach(() => {
    profiles = { bot: enrolledProfile };
    secretKeyImpl = async () => SECRET_KEY;
    secretKeyReads = 0;
    createSendIntentImpl = async () => DEEPLINK;
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

  describe("native ETH", () => {
    it("proposes an exact base-unit amount and reports the intent id and review link", async () => {
      await runSend({ output: "json" });

      expect(submittedIntents).toEqual([
        {
          type: "send",
          network: "ethereum",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: "10000000000000000",
          asset: { type: "native" },
          feeStrategy: "medium",
        },
      ]);
      expect(jsonResult()).toMatchObject({
        status: "success",
        command: "agent-intent send",
        intentId: "intent-123",
        deeplink: DEEPLINK,
        profileId: "bot",
        sender: SENDER,
        recipient: RECIPIENT,
        asset: { type: "native", ticker: "ETH", decimals: 18 },
        amount: "10000000000000000",
        feeStrategy: "medium",
        submitted: true,
      });
    });

    it("authenticates with the profile's own identity, trustchain, BFF and environment", async () => {
      await runSend();

      expect(clientOptions).toEqual([
        expect.objectContaining({
          bffBaseUrl: enrolledProfile.bffBaseUrl,
          trustchainId: "tc-1",
          environment: "staging",
          identity: expect.objectContaining({ publicKey: agent.publicKey }),
        }),
      ]);
    });

    it("passes the fee strategy and description through", async () => {
      await runSend({ "fee-strategy": "fast", description: "Monthly rent" });

      expect(submittedIntents).toEqual([
        expect.objectContaining({ feeStrategy: "fast", description: "Monthly rent" }),
      ]);
    });

    it("shows the review link and says nothing was signed or broadcast", async () => {
      await runSend();

      const printed = stdout.join("");
      expect(printed).toContain(DEEPLINK);
      expect(printed).toContain("nothing was signed or broadcast");
      expect(printed).toContain("Amount:  0.01 ETH");
    });
  });

  describe("sender", () => {
    it("resolves an account label to its address", async () => {
      await runSend({ from: undefined, account: "ethereum-1" });

      expect(submittedIntents).toEqual([expect.objectContaining({ sender: SENDER })]);
    });

    it("rejects a label on a network Agent Intent doesn't support", async () => {
      await expect(runSend({ from: undefined, account: "bitcoin-native-1" })).rejects.toThrow(
        /on bitcoin; Agent Intent send intents support Ethereum mainnet accounts only/,
      );
    });

    it("rejects an unknown label", async () => {
      await expect(runSend({ from: undefined, account: "ethereum-9" })).rejects.toThrow(
        /No account labeled "ethereum-9"/,
      );
    });

    it("requires exactly one of --account and --from", async () => {
      await expect(runSend({ from: undefined })).rejects.toThrow(/exactly one sender/);
      await expect(runSend({ account: "ethereum-1" })).rejects.toThrow(/exactly one sender/);
    });

    it("validates explicit sender and recipient addresses", async () => {
      await expect(runSend({ from: "0x1234" })).rejects.toThrow(/--from .*not an EVM address/);
      await expect(runSend({ to: RECIPIENT.replace("fB69", "Fb69") })).rejects.toThrow(
        /--to .*invalid EIP-55 checksum/,
      );
      expect(submittedIntents).toEqual([]);
    });
  });

  describe("ERC-20", () => {
    it("proposes a token send with the contract as asset reference and token decimals", async () => {
      await runSend({ amount: "25.5 USDC", token: USDC.toLowerCase(), output: "json" });

      expect(submittedIntents).toEqual([
        expect.objectContaining({
          amount: "25500000",
          asset: { type: "erc20", assetReference: USDC },
        }),
      ]);
      expect(jsonResult()).toMatchObject({
        asset: { type: "erc20", ticker: "USDC", decimals: 6, contract: USDC },
        amount: "25500000",
        displayAmount: "25.5",
      });
    });

    it("names the token and its contract in human output", async () => {
      await runSend({ amount: "25 USDC", token: USDC });

      expect(stdout.join("")).toContain(`Amount:  25 USDC (${USDC})`);
    });

    it("rejects a contract CAL doesn't know on Ethereum mainnet", async () => {
      await expect(
        runSend({ amount: "1 XYZ", token: "0x0000000000000000000000000000000000000001" }),
      ).rejects.toThrow(/not a known ERC-20 token on Ethereum mainnet/);
    });

    it("rejects a ticker that doesn't match the token", async () => {
      await expect(runSend({ amount: "25 USDT", token: USDC })).rejects.toThrow(
        /--amount is in USDT, but --token .* is USDC/,
      );
    });

    it("rejects a token ticker without --token instead of sending ETH", async () => {
      await expect(runSend({ amount: "25 USDC" })).rejects.toThrow(
        /without --token the intent sends native ETH/,
      );
    });
  });

  describe("amount", () => {
    it("rejects more decimals than the asset has instead of rounding", async () => {
      await expect(runSend({ amount: "1.0000001 USDC", token: USDC })).rejects.toThrow(
        /7 decimal places, but USDC supports at most 6/,
      );
      expect(submittedIntents).toEqual([]);
    });

    it("keeps a value beyond 2^53 exact", async () => {
      await runSend({ amount: "123456789.123456789123456789 ETH" });

      expect(submittedIntents).toEqual([
        expect.objectContaining({ amount: "123456789123456789123456789" }),
      ]);
    });
  });

  describe("profile and keychain", () => {
    it("rejects an unknown profile", async () => {
      await expect(runSend({ profile: "nope" })).rejects.toThrow(
        /No Agent Intent profile named "nope"/,
      );
    });

    it("rejects a profile whose enrollment wasn't completed", async () => {
      profiles = { bot: { ...enrolledProfile, trustchainId: undefined } };

      await expect(runSend()).rejects.toThrow(/not enrolled yet.*agent-intent complete/s);
      expect(secretKeyReads).toBe(0);
    });

    it("reports a missing keychain key without contacting the service", async () => {
      secretKeyImpl = async () => null;

      await expect(runSend()).rejects.toThrow(/No secret key for Agent Intent profile "bot"/);
      expect(clientOptions).toEqual([]);
    });

    it("reports a corrupt keychain entry actionably", async () => {
      secretKeyImpl = async () => {
        throw new AgentIntentCorruptKeychainError("Corrupt keychain entry for profile bot.");
      };

      await expect(runSend()).rejects.toThrow(/Corrupt keychain entry.*Re-enroll/s);
    });

    it("catches a keychain key that doesn't belong to the profile before submitting", async () => {
      secretKeyImpl = async () => OTHER_AGENT.exportSecretKey();

      await expect(runSend()).rejects.toThrow(/doesn't match its recorded public key/);
      expect(clientOptions).toEqual([]);
    });
  });

  describe("--dry-run", () => {
    it("validates and prints the intent without reading the keychain or submitting", async () => {
      await runSend({ "dry-run": true, output: "json" });

      expect(secretKeyReads).toBe(0);
      expect(clientOptions).toEqual([]);
      expect(jsonResult()).toMatchObject({
        dryRun: true,
        submitted: false,
        amount: "10000000000000000",
      });
      expect(jsonResult()).not.toHaveProperty("deeplink");
    });

    it("runs the SDK's own intent validation, so it rejects what a real submit would", async () => {
      await expect(runSend({ "dry-run": true, description: "x".repeat(281) })).rejects.toThrow(
        /Invalid intent: .*description/i,
      );
      expect(secretKeyReads).toBe(0);
    });

    it("still rejects invalid input", async () => {
      await expect(runSend({ "dry-run": true, amount: "0 ETH" })).rejects.toThrow(
        /greater than zero/,
      );
    });
  });

  describe("service responses", () => {
    it("maps a service rejection to an actionable message", async () => {
      createSendIntentImpl = async () => {
        throw new AgentIntentHttpError(
          "The intent issuer does not match the authenticated agent.",
          403,
          "pubkey_mismatch",
        );
      };

      await expect(runSend()).rejects.toThrow(
        /issuer does not match the authenticated agent.*Re-enroll/s,
      );
    });

    it("submits exactly once — no retry on a service error", async () => {
      createSendIntentImpl = async () => {
        throw new AgentIntentHttpError("down", 503);
      };

      await expect(runSend()).rejects.toThrow(/temporarily unavailable/);
      expect(submittedIntents).toHaveLength(1);
    });

    it("succeeds with a null intent id and a warning when the link has an unexpected shape", async () => {
      createSendIntentImpl = async () => "https://agent-intent.ledger-test.com/review?id=abc";

      await runSend({ output: "json" });

      expect(jsonResult()).toMatchObject({ intentId: null, submitted: true });
      expect(stderr.join("")).toContain("no intent id could be extracted");
    });
  });

  describe("redaction", () => {
    it("never prints the profile's secret key, on success or failure", async () => {
      await runSend();
      await runSend({ output: "json" });
      await runSend({ "dry-run": true });
      createSendIntentImpl = async () => {
        throw new AgentIntentHttpError(`body echoing ${SECRET_KEY}`, 500);
      };
      await runSend().catch(e => stderr.push(String(e)));

      expect([...stdout, ...stderr].join("")).not.toContain(SECRET_KEY);
    });
  });

  describe("with the real SDK client over a fake transport", () => {
    it("re-authenticates once on a 401 and sends the exact amount and ERC-20 asset on the wire", async () => {
      const posts: Array<{ authorization: string | null; body: string }> = [];
      const tokens: string[] = [];
      makeClient = options =>
        realAgentIntentSdk.createAgentIntentClient({
          ...(options as Parameters<typeof realAgentIntentSdk.createAgentIntentClient>[0]),
          tokenProvider: {
            async withAccessToken(query, retryWhen) {
              tokens.push("t1");
              const first = await query("t1");
              if (!retryWhen?.(first)) return first;
              tokens.push("t2");
              return query("t2");
            },
          },
          fetch: (async (_url: unknown, init?: RequestInit) => {
            posts.push({
              authorization: new Headers(init?.headers).get("authorization"),
              body: String(init?.body),
            });
            return posts.length === 1
              ? new Response("expired", { status: 401 })
              : new Response("https://bff.example.com/intents/wire-1", { status: 200 });
          }) as typeof fetch,
        });

      await runSend({
        amount: "123456789.123456 USDC",
        token: USDC,
        output: "json",
      });

      expect(tokens).toEqual(["t1", "t2"]);
      expect(posts.map(p => p.authorization)).toEqual(["Bearer t1", "Bearer t2"]);
      const body = posts[1]?.body ?? "";
      expect(body).toContain('"amount":123456789123456');
      expect(body).toContain('"type":"erc20"');
      expect(body.toLowerCase()).toContain(USDC.slice(2).toLowerCase());
      expect(body).not.toContain(SECRET_KEY);
      // The SDK rebases the service's link onto the environment's own frontend.
      expect(jsonResult()).toMatchObject({
        intentId: "wire-1",
        deeplink: "https://agent-intent.ledger-test.com/intents/wire-1",
      });
    });
  });
});
