import "../../live-common-setup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import {
  AGENT_INTENT_STATUSES,
  AgentIntentHttpError,
  type AgentIntentRecord,
} from "@ledgerhq/agent-intent-sdk";
import { installOutputCapture } from "../../shared/ui";
import { toChecksumAddress } from "../../agent-intent/evm";
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
        terminal: ["success", "failed", "rejected", "cancelled", "expired"].includes(status),
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
