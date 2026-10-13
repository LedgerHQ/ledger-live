import "../../live-common-setup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import {
  AGENT_INTENT_STATUSES,
  AgentIntentHttpError,
  type AgentIntentRecord,
} from "@ledgerhq/agent-intent-sdk";
import { installOutputCapture } from "../../shared/ui";
import { toChecksumAddress } from "../../agent-intent/evm";
import { isTerminalIntentStatus } from "../../agent-intent/intent-list";
import {
  activateAgentIntentMocks,
  deactivateAgentIntentMocks,
  realAgentIntentSdk,
} from "./__test-helpers__/agent-intent-mocks";

const agent = realAgentIntentSdk.createSoftwareAgentIdentity();
const SECRET_KEY = agent.exportSecretKey();

const SENDER = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
const RECIPIENT = "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359";
const USDC = toChecksumAddress("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
const INTENT_ID = "0192f7a4-0000-7000-8000-000000000001";

const SWAP_INTENT = {
  type: "swap",
  network: "ethereum",
  sender: SENDER,
  fromAsset: "ethereum",
  toAsset: "ethereum/erc20/usd__coin",
  fromAmount: "0.5",
  toAmount: "1250",
  provider: "velora",
};
// The 0x11 × 32 and 0x22 × 32 keys of agent-intent-service ADR-0002's Solana vectors.
const SOL_SENDER = "29d2S7vB453rNYFdR5Ycwt7y9haRT5fwVwL9zTmBhfV2";
const SOL_RECIPIENT = "3JF3sEqM796hk5WFqA6EtmEwJQ9quALszsfJyvXNQKy3";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOLANA_SEND = {
  type: "send",
  network: "solana",
  sender: SOL_SENDER,
  recipient: SOL_RECIPIENT,
  amount: "2500000",
  asset: { type: "spl-token", assetReference: USDC_MINT },
  memo: "Invoice 42",
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

function record(
  overrides: Omit<Partial<AgentIntentRecord>, "intent"> & { intent?: Record<string, unknown> } = {},
) {
  return {
    id: INTENT_ID,
    agentPubkey: agent.publicKey,
    status: "signed",
    createdAt: "2026-10-07T10:00:00Z",
    updatedAt: "2026-10-07T10:05:00Z",
    ...overrides,
    intent: {
      type: "send",
      network: "ethereum",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: "10000000000000000",
      asset: { type: "native" },
      feeStrategy: "medium",
      ...overrides.intent,
    },
  } as AgentIntentRecord;
}

let profiles: Record<string, unknown>;
let secretKeyReads: number;
let getImpl: (intentId: string) => Promise<AgentIntentRecord>;
let lookups: string[];
let stdout: string[];
let stderr: string[];

beforeAll(() =>
  activateAgentIntentMocks({
    sessionRead: async () => ({ getAgentIntentProfile: (id: string) => profiles[id] }),
    keychain: {
      loadAgentIntentSecretKey: async () => {
        secretKeyReads++;
        return SECRET_KEY;
      },
    },
    sdk: {
      createAgentIntentClient: () => ({
        publicKey: agent.publicKey,
        getIntent: async (intentId: string) => {
          lookups.push(intentId);
          return getImpl(intentId);
        },
      }),
    },
    tokenLookup: {
      findEthereumToken: async (contract: string) =>
        contract.toLowerCase() === USDC.toLowerCase()
          ? { ticker: "USDC", decimals: 6, contract: USDC }
          : null,
      findEthereumSwapAsset: async (id: string) =>
        ({
          ethereum: { id, ticker: "ETH", decimals: 18 },
          "ethereum/erc20/usd__coin": { id, ticker: "USDC", decimals: 6 },
        })[id] ?? null,
      findSolanaToken: async (mint: string) =>
        mint === USDC_MINT ? { ticker: "USDC", decimals: 6, mint: USDC_MINT } : null,
    },
  }),
);
afterAll(() => deactivateAgentIntentMocks());

const { default: statusCommand } = await import("./status");

type StatusFlags = { profile: string; intent: string; output?: "human" | "json" };

function runStatus(overrides: Partial<StatusFlags> = {}) {
  const flags: StatusFlags = { profile: "bot", intent: INTENT_ID, ...overrides };
  return (
    statusCommand as unknown as { handler: (a: { flags: StatusFlags }) => Promise<void> }
  ).handler({ flags });
}

function jsonResult(): Record<string, unknown> {
  return JSON.parse(stdout.join("").trim().split("\n").at(-1) ?? "{}");
}

describe("agent-intent status", () => {
  let restore: () => void;

  beforeEach(() => {
    profiles = { bot: enrolledProfile };
    secretKeyReads = 0;
    getImpl = async () => record();
    lookups = [];
    stdout = [];
    stderr = [];
    restore = installOutputCapture({
      stdout: chunk => stdout.push(chunk),
      stderr: chunk => stderr.push(chunk),
    });
  });

  afterEach(() => restore());

  it("reports the intent as stable JSON with an exact amount", async () => {
    await runStatus({ output: "json" });

    expect(lookups).toEqual([INTENT_ID]);
    expect(jsonResult()).toMatchObject({
      status: "success",
      command: "agent-intent status",
      profileId: "bot",
      terminal: false,
      intent: {
        id: INTENT_ID,
        status: "signed",
        amount: "10000000000000000",
        displayAmount: "0.01 ETH",
        sender: SENDER,
        recipient: RECIPIENT,
        createdAt: "2026-10-07T10:00:00Z",
        updatedAt: "2026-10-07T10:05:00Z",
      },
    });
  });

  it.each(AGENT_INTENT_STATUSES.map(status => [status]))(
    "renders the %s state, flagging final ones for polling",
    async status => {
      getImpl = async () => record({ status });

      await runStatus({ output: "json" });
      expect(jsonResult()).toMatchObject({
        terminal: isTerminalIntentStatus(status),
        intent: { status },
      });

      stdout = [];
      await runStatus();
      expect(stdout.join("")).toContain(`Status:  ${status}`);
    },
  );

  it("passes an unknown future state through with terminal null instead of failing", async () => {
    getImpl = async () => record({ status: "archived" });

    await runStatus({ output: "json" });
    expect(jsonResult()).toMatchObject({ terminal: null, intent: { status: "archived" } });

    stdout = [];
    await runStatus();
    expect(stdout.join("")).toContain("archived (unknown to this wallet-cli version)");
  });

  it("shows a swap's pair and provider", async () => {
    getImpl = async () => ({ ...record(), intent: SWAP_INTENT }) as AgentIntentRecord;

    await runStatus({ output: "json" });
    expect(jsonResult()).toMatchObject({
      intent: { displayAmount: "0.5 ETH → 1250 USDC", swap: { provider: "velora" } },
    });

    stdout = [];
    await runStatus();
    expect(stdout.join("")).toContain("Amount:  0.5 ETH → 1250 USDC via velora");
  });

  it("shows a Solana SPL send in token units, with its memo", async () => {
    getImpl = async () => ({ ...record(), intent: SOLANA_SEND }) as AgentIntentRecord;

    await runStatus();

    const text = stdout.join("");
    expect(text).toContain("Amount:  2.5 USDC");
    expect(text).toContain("Network: solana");
    expect(text).toContain("Memo:    Invoice 42");
  });

  it("shows why a failed intent failed", async () => {
    getImpl = async () => record({ status: "failed", failureReason: "insufficient funds" });

    await runStatus();

    expect(stdout.join("")).toContain("Failure: insufficient funds");
  });

  it("shows an ERC-20 amount in token units", async () => {
    getImpl = async () =>
      record({ intent: { amount: "2500000", asset: { type: "erc20", assetReference: USDC } } });

    await runStatus({ output: "json" });

    expect(jsonResult()).toMatchObject({ intent: { displayAmount: "2.5 USDC" } });
  });

  it("falls back to base units for an ERC-20 contract CAL doesn't know", async () => {
    getImpl = async () =>
      record({
        intent: {
          amount: "2500000",
          asset: { type: "erc20", assetReference: "0x0000000000000000000000000000000000000001" },
        },
      });

    await runStatus();

    expect(stdout.join("")).toContain("Amount:  2500000 (base units)");
  });

  it("strips terminal control sequences from what the service returns", async () => {
    getImpl = async () =>
      record({
        status: "failed",
        failureReason: "out of \u001b]0;pwned\u0007gas",
        intent: { description: "Pay \u001b[2Jsupplier\u009b" },
      });

    await runStatus();

    const text = stdout.join("");
    expect(text).toContain("Note:    Pay [2Jsupplier");
    expect(text).toContain("Failure: out of ]0;pwnedgas");
    for (const control of ["\u001b", "\u0007", "\u009b"]) expect(text).not.toContain(control);
  });

  it("normalizes the id and rejects a malformed one before touching the keychain", async () => {
    await runStatus({ intent: ` ${INTENT_ID.toUpperCase()} ` });
    expect(lookups).toEqual([INTENT_ID]);

    secretKeyReads = 0;
    await expect(runStatus({ intent: "intent-123" })).rejects.toThrow(/is not an intent id/);
    expect(secretKeyReads).toBe(0);
  });

  it("rejects a profile that is not enrolled", async () => {
    profiles = { bot: { ...enrolledProfile, trustchainId: undefined } };

    await expect(runStatus()).rejects.toThrow(/is not enrolled yet/);
    expect(lookups).toEqual([]);
  });

  it.each([
    [404, undefined, /has no intent .*doesn't exist, or another agent created it/],
    [400, undefined, /rejected intent id/],
    [403, "unexpected_caller", /doesn't let agents read a single intent yet/],
    [403, "not_a_member", /not an active agent on its Trustchain/],
    [401, "token_expired", /Authentication with the Agent Intent service failed/],
    [429, undefined, /rate-limiting requests/],
    [503, undefined, /HTTP 503.*Re-run the command later/],
  ])("turns HTTP %d %s into an actionable error", async (status, type, message) => {
    getImpl = async () => {
      throw new AgentIntentHttpError("detail", status, type);
    };

    await expect(runStatus()).rejects.toThrow(message);
  });

  it("redacts tokens from a network failure", async () => {
    getImpl = async () => {
      throw new Error("connect ECONNREFUSED Bearer abc.def.ghi");
    };

    const error = (await runStatus().catch((cause: unknown) => cause)) as Error;
    expect(error.message).toMatch(/Could not reach the Agent Intent service/);
    expect(error.message).not.toContain("abc.def.ghi");
  });

  it("never prints the agent secret key", async () => {
    await runStatus({ output: "json" });
    await runStatus();

    expect(stdout.join("") + stderr.join("")).not.toContain(SECRET_KEY);
  });
});
