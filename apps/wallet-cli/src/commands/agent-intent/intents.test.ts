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

  it("lists a swap with its pair and provider, and a Solana send with its token and memo", async () => {
    listImpl = async () => ({
      intents: [
        { ...record({ id: "swap" }), intent: SWAP_INTENT },
        { ...record({ id: "sol" }), intent: SOLANA_SEND },
      ] as AgentIntentRecord[],
    });

    await runIntents({ output: "json" });

    expect(jsonResult().intents).toEqual([
      expect.objectContaining({
        id: "swap",
        type: "swap",
        amount: null,
        displayAmount: "0.5 ETH → 1250 USDC",
        swap: {
          fromAsset: "ethereum",
          toAsset: "ethereum/erc20/usd__coin",
          fromAmount: "0.5",
          toAmount: "1250",
          provider: "velora",
        },
        memo: null,
      }),
      expect.objectContaining({
        id: "sol",
        network: "solana",
        amount: "2500000",
        displayAmount: "2.5 USDC",
        memo: "Invoice 42",
        swap: null,
      }),
    ]);

    stdout = [];
    await runIntents();
    expect(stdout.join("")).toContain("0.5 ETH → 1250 USDC");
    expect(stdout.join("")).toContain("2.5 USDC");
  });

  it("still lists an intent type this version doesn't know", async () => {
    listImpl = async () => ({
      intents: [
        {
          ...record({ id: "stake" }),
          intent: { type: "stake", network: "ethereum", sender: SENDER },
        },
      ] as AgentIntentRecord[],
    });

    await runIntents({ output: "json" });

    expect(jsonResult().intents).toEqual([
      expect.objectContaining({ id: "stake", type: "stake", displayAmount: null, swap: null }),
    ]);
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

  it("strips terminal control characters from service values in the table and hint", async () => {
    listImpl = async () => ({
      intents: [
        record({
          id: "id-\u001b[2J",
          status: "signed\u0007",
          intent: { recipient: "0xfB69\u001b]0;pwned\u0007", amount: "7\u001b[31m" },
        }),
      ],
      nextCursor: "next-\u001b[2Jtoken",
    });

    await runIntents();

    const text = stdout.join("");
    for (const sequence of ["\u001b[2J", "\u001b]0", "\u0007", "\u001b[31m"]) {
      expect(text).not.toContain(sequence);
    }
    expect(text).toContain("id-[2J");
    expect(text).toContain("re-run with --cursor next-[2Jtoken");
  });

  it.each(["abc", "0x10", "-5", "1.5"])(
    "lists an intent whose amount %p isn't a base-unit integer, with no display amount",
    async amount => {
      listImpl = async () => ({
        intents: [record({ id: "odd", intent: { amount } }), record({ id: "plain" })],
      });

      await runIntents({ output: "json" });

      expect(
        (jsonResult().intents as Array<Record<string, unknown>>).map(i => [
          i.id,
          i.amount,
          i.displayAmount,
        ]),
      ).toEqual([
        ["odd", amount, null],
        ["plain", "10000000000000000", "0.01 ETH"],
      ]);
    },
  );

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
