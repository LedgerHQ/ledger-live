import "../../live-common-setup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import {
  AgentIntentHttpError,
  type AgentIntentPage,
  type AgentIntentRecord,
  type ListAgentIntentsQuery,
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
const UNKNOWN_TOKEN = toChecksumAddress("0x1111111111111111111111111111111111111111");

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
    id: "0192f7a4-0000-7000-8000-000000000001",
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
let listImpl: (query: ListAgentIntentsQuery) => Promise<AgentIntentPage>;
let queries: ListAgentIntentsQuery[];
let clientOptions: Array<Record<string, unknown>>;
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
      createAgentIntentClient: (options: Record<string, unknown>) => {
        clientOptions.push(options);
        return {
          publicKey: agent.publicKey,
          listIntents: async (query: ListAgentIntentsQuery) => {
            queries.push(query);
            return listImpl(query);
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

const { default: intentsCommand } = await import("./intents");

type IntentsFlags = {
  profile: string;
  status?: string;
  "page-size"?: string;
  cursor?: string;
  output?: "human" | "json";
};

function runIntents(overrides: Partial<IntentsFlags> = {}) {
  const flags: IntentsFlags = { profile: "bot", ...overrides };
  return (
    intentsCommand as unknown as { handler: (a: { flags: IntentsFlags }) => Promise<void> }
  ).handler({ flags });
}

function jsonResult(): Record<string, unknown> {
  return JSON.parse(stdout.join("").trim().split("\n").at(-1) ?? "{}");
}

describe("agent-intent intents", () => {
  let restore: () => void;

  beforeEach(() => {
    profiles = { bot: enrolledProfile };
    secretKeyReads = 0;
    listImpl = async () => ({ intents: [record()] });
    queries = [];
    clientOptions = [];
    stdout = [];
    stderr = [];
    restore = installOutputCapture({
      stdout: chunk => stdout.push(chunk),
      stderr: chunk => stderr.push(chunk),
    });
  });

  afterEach(() => restore());

  it("lists the profile's intents as stable JSON with exact amounts", async () => {
    await runIntents({ output: "json" });

    expect(jsonResult()).toMatchObject({
      status: "success",
      command: "agent-intent intents",
      profileId: "bot",
      count: 1,
      nextCursor: null,
      intents: [
        {
          id: "0192f7a4-0000-7000-8000-000000000001",
          status: "signed",
          type: "send",
          network: "ethereum",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: "10000000000000000",
          displayAmount: "0.01 ETH",
          asset: { type: "native", assetReference: null },
          feeStrategy: "medium",
          description: null,
          failureReason: null,
          createdAt: "2026-10-07T10:00:00Z",
          updatedAt: "2026-10-07T10:05:00Z",
        },
      ],
    });
  });

  it("authenticates with the profile's own identity, trustchain, BFF and environment", async () => {
    await runIntents();

    expect(clientOptions).toEqual([
      expect.objectContaining({
        bffBaseUrl: enrolledProfile.bffBaseUrl,
        trustchainId: "tc-1",
        environment: "staging",
        identity: expect.objectContaining({ publicKey: agent.publicKey }),
      }),
    ]);
  });

  it("passes status filters and page size, and reports the next cursor", async () => {
    listImpl = async () => ({ intents: [record()], nextCursor: "next-token" });

    await runIntents({ status: "signed, broadcast,signed", "page-size": "50", output: "json" });

    expect(queries).toEqual([{ status: ["signed", "broadcast"], pageSize: 50, cursor: undefined }]);
    expect(jsonResult()).toMatchObject({ nextCursor: "next-token" });
  });

  it("continues from a cursor", async () => {
    await runIntents({ cursor: "next-token" });

    expect(queries).toEqual([{ status: undefined, pageSize: undefined, cursor: "next-token" }]);
  });

  it("shows ERC-20 amounts in token units only when the token is known", async () => {
    listImpl = async () => ({
      intents: [
        record({
          id: "known",
          intent: { amount: "2500000", asset: { type: "erc20", assetReference: USDC } },
        }),
        record({
          id: "unknown",
          intent: { amount: "7", asset: { type: "erc20", assetReference: UNKNOWN_TOKEN } },
        }),
      ],
    });

    await runIntents({ output: "json" });

    expect(
      (jsonResult().intents as Array<Record<string, unknown>>).map(i => i.displayAmount),
    ).toEqual(["2.5 USDC", null]);
  });

  it("prints a human table with a next-page hint", async () => {
    listImpl = async () => ({ intents: [record()], nextCursor: "next-token" });

    await runIntents();

    const text = stdout.join("");
    expect(text).toContain("CREATED");
    expect(text).toContain("2026-10-07 10:00");
    expect(text).toContain("0.01 ETH");
    expect(text).toContain(RECIPIENT);
    expect(text).toContain("re-run with --cursor next-token");
  });

  it("reports an empty page as success", async () => {
    listImpl = async () => ({ intents: [] });

    await runIntents();
    expect(stdout.join("")).toContain('No intents for profile "bot".');

    stdout = [];
    await runIntents({ output: "json" });
    expect(jsonResult()).toMatchObject({
      status: "success",
      count: 0,
      intents: [],
      nextCursor: null,
    });
  });

  it("rejects an unknown --status before touching the keychain", async () => {
    await expect(runIntents({ status: "signed,pending" })).rejects.toThrow(
      /Unknown --status "pending"/,
    );
    expect(secretKeyReads).toBe(0);
    expect(queries).toEqual([]);
  });

  it("rejects a profile that is not enrolled", async () => {
    profiles = { bot: { ...enrolledProfile, trustchainId: undefined } };

    await expect(runIntents()).rejects.toThrow(/is not enrolled yet/);
    expect(queries).toEqual([]);
  });

  it.each([
    [400, "invalid_cursor", /Check --status and --page-size; a --cursor only works/],
    [429, undefined, /rate-limiting requests/],
    [503, undefined, /HTTP 503.*Re-run the command later/],
    [403, "not_a_member", /not an active agent on its Trustchain/],
  ])("turns HTTP %d into an actionable error", async (status, type, message) => {
    listImpl = async () => {
      throw new AgentIntentHttpError("detail", status, type);
    };

    await expect(runIntents()).rejects.toThrow(message);
  });

  it("never prints the agent secret key", async () => {
    await runIntents({ output: "json" });
    await runIntents();

    expect(stdout.join("") + stderr.join("")).not.toContain(SECRET_KEY);
  });
});
