import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { buildAttestation } from "@ledgerhq/agent-intent-sdk";
import {
  FakeAgentIntentService,
  intentRecord,
  makeEnrolledProfile,
  type EnrolledProfile,
} from "../../testing/agent-intent-service";
import { CAL_KNOWS_USDC, USDC_CONTRACT, USDC_MINT } from "../../testing/agent-intent-cal-routes";
import { KEYCLOAK_TOKEN } from "../../testing/auth-routes";
import { useFreshCalCache } from "../../testing/cal-cache";
import { runCli } from "../../testing/cli-runner";
import { MockServer } from "../../testing/mock-server";

const SENDER = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
const RECIPIENT = "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359";
const UNKNOWN_TOKEN = "0x1111111111111111111111111111111111111111";
const BASE58_CURSOR = "3vQB7B6MrGQZaxCuFg4oh";
const CURSOR_CONFLICT =
  "--cursor continues with the filters and page size of the listing that returned it: drop ";

const service = new FakeAgentIntentService();
const server = new MockServer([...service.routes, ...CAL_KNOWS_USDC]);
let fixture: EnrolledProfile;
let env: Record<string, string>;
let restoreCalCache: () => void;

beforeAll(async () => {
  server.start();
  fixture = await makeEnrolledProfile();
  env = { ...fixture.env, WALLET_CLI_MOCK_PORT: String(server.port) };
});
afterAll(() => {
  fixture.cleanup();
  server.stop();
});
beforeEach(() => {
  restoreCalCache = useFreshCalCache();
  service.reset();
});
afterEach(() => {
  restoreCalCache();
  fixture.keychain.readError = undefined;
});

type Overrides = Parameters<typeof intentRecord>[1];

function record(overrides: Overrides = {}) {
  return intentRecord(fixture.agent.publicKey, overrides);
}

/** The service answers the listing with these intents, and `nextCursor` in `X-Ledger-Next`. */
function listing(intents: Overrides[], nextCursor?: string) {
  service.reply("listIntents", {
    json: intents.map(record),
    headers: nextCursor === undefined ? undefined : { "X-Ledger-Next": nextCursor },
  });
}

function intents(...args: string[]) {
  return runCli(["agent-intent", "intents", "--profile", "bot", ...args], env);
}

async function intentsJson(...args: string[]) {
  const run = await intents(...args, "--output", "json");
  return { ...run, json: JSON.parse(run.stdout) };
}

const SWAP = {
  type: "swap",
  fromAsset: "ethereum",
  toAsset: "ethereum/erc20/usd__coin",
  fromAmount: "0.5",
  toAmount: "1250",
  provider: "velora",
  recipient: undefined,
  amount: undefined,
  asset: undefined,
  feeStrategy: undefined,
};

const SOLANA_USDC_SEND = {
  network: "solana",
  sender: "29d2S7vB453rNYFdR5Ycwt7y9haRT5fwVwL9zTmBhfV2",
  recipient: "3JF3sEqM796hk5WFqA6EtmEwJQ9quALszsfJyvXNQKy3",
  amount: "2500000",
  asset: { type: "spl-token", assetReference: USDC_MINT },
  feeStrategy: undefined,
  memo: "Invoice 42",
};

describe("agent-intent intents (CLI)", () => {
  it("signs in as the profile's agent and lists its intents as JSON with exact amounts", async () => {
    listing([{}]);

    const { json, exitCode, stderr } = await intentsJson();

    expect(exitCode, stderr).toBe(0);
    expect(json).toMatchObject({
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
    expect(service.requests.map(r => [r.endpoint, r.search.toString(), r.authorization])).toEqual([
      ["listIntents", "", `Bearer ${KEYCLOAK_TOKEN}`],
    ]);
    expect(service.signIns).toEqual([
      {
        publicKey: fixture.agent.publicKey,
        attestation: buildAttestation(fixture.trustchainId),
        signatureValid: true,
      },
    ]);
  });

  it("asks for the status filters and page size, and reports the next cursor", async () => {
    listing([{}], "next-token");

    const { json } = await intentsJson("--status", "signed, broadcast,signed", "--page-size", "50");

    expect(service.calls("listIntents").map(r => Object.fromEntries(r.search))).toEqual([
      { status: "signed,broadcast", pageSize: "50" },
    ]);
    expect(json).toMatchObject({ nextCursor: "next-token" });
  });

  it("continues from a cursor", async () => {
    listing([{}]);

    await intents("--cursor", "next-token");

    expect(service.calls("listIntents").map(r => Object.fromEntries(r.search))).toEqual([
      { cursor: "next-token" },
    ]);
  });

  it.each([
    [["--status", "signed"], "--status"],
    [["--page-size", "50"], "--page-size"],
    [["--status", "signed", "--page-size", "50"], "--status and --page-size"],
    // Refused before the size itself is checked.
    [["--page-size", "7"], "--page-size"],
  ])(
    "refuses %p with a cursor before reading the agent key, naming only those flags",
    async (flags, named) => {
      fixture.keychain.readError = new Error("the agent key was read");

      const { json, exitCode } = await intentsJson("--cursor", "next-token", ...flags);

      expect(exitCode).toBe(1);
      expect(json.error.message).toBe(`${CURSOR_CONFLICT}${named}.`);
      expect(service.requests).toEqual([]);
      expect(service.signIns).toEqual([]);
    },
  );

  it.each(["7", "010", "10.0", "abc"])("rejects --page-size %p", async pageSize => {
    const { json, exitCode } = await intentsJson("--page-size", pageSize);

    expect(exitCode).toBe(1);
    expect(json.error.message).toBe("--page-size must be one of 1, 5, 10, 50, 100.");
    expect(service.requests).toEqual([]);
  });

  it("rejects an unknown --status before reading the agent key", async () => {
    fixture.keychain.readError = new Error("the agent key was read");

    const { json, exitCode } = await intentsJson("--status", "signed,pending");

    expect(exitCode).toBe(1);
    expect(json.error.message).toMatch(/Unknown --status "pending"/);
    expect(service.requests).toEqual([]);
    expect(service.signIns).toEqual([]);
  });

  it("shows the creation time in UTC whatever offset the service sent", async () => {
    listing([{ createdAt: "2026-10-07T12:30:00+02:00" }]);

    const { stdout } = await intents();

    expect(stdout).toContain("2026-10-07 10:30");
  });

  it.each(["yesterday", "2026-10-07T10:00:00"])(
    "shows a creation time %p with no offset to place in UTC as the service sent it",
    async createdAt => {
      listing([{ createdAt }]);

      const { stdout } = await intents();

      expect(stdout).toContain(createdAt);
    },
  );

  it("shows ERC-20 amounts in token units only when the token is known", async () => {
    listing([
      {
        id: "known",
        intent: { amount: "2500000", asset: { type: "erc20", assetReference: USDC_CONTRACT } },
      },
      {
        id: "unknown",
        intent: { amount: "7", asset: { type: "erc20", assetReference: UNKNOWN_TOKEN } },
      },
    ]);

    const { json } = await intentsJson();

    expect(json.intents.map((i: { displayAmount: unknown }) => i.displayAmount)).toEqual([
      "2.5 USDC",
      null,
    ]);
  });

  it("lists a swap with its pair and provider, and a Solana send with its token and memo", async () => {
    listing([
      { id: "swap", intent: SWAP },
      { id: "sol", intent: SOLANA_USDC_SEND },
    ]);

    const { json } = await intentsJson();
    expect(json.intents).toEqual([
      expect.objectContaining({
        id: "swap",
        type: "swap",
        amount: null,
        displayAmount: "0.5 ETH → ~1250 USDC",
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

    const { stdout } = await intents();
    expect(stdout).toContain("0.5 ETH → ~1250 USDC via velora");
    expect(stdout).toContain("2.5 USDC");
  });

  it("still lists an intent type this version doesn't know", async () => {
    listing([{ id: "stake", intent: { ...SWAP, type: "stake", provider: undefined } }]);

    const { json } = await intentsJson();

    expect(json.intents).toEqual([
      expect.objectContaining({ id: "stake", type: "stake", displayAmount: null, swap: null }),
    ]);
  });

  it("prints a human table and the command for the next page", async () => {
    listing([{}], BASE58_CURSOR);

    const { stdout, exitCode } = await intents();

    expect(exitCode).toBe(0);
    expect(stdout).toContain("CREATED (UTC)");
    expect(stdout).toContain("2026-10-07 10:00");
    expect(stdout).toContain("0.01 ETH");
    expect(stdout).toContain(RECIPIENT);
    expect(stdout).toContain(
      `More intents: run \`wallet-cli agent-intent intents --profile bot --cursor ${BASE58_CURSOR}\``,
    );
  });

  it("gives only the cursor, not a command to paste, when the cursor isn't base58", async () => {
    listing([{}], "abc def;$(id)");

    const { stdout } = await intents();

    expect(stdout).toContain("More intents: next cursor abc def;$(id)");
    expect(stdout).not.toContain("wallet-cli agent-intent intents");
  });

  it("strips terminal control characters from service values in the table and hint", async () => {
    listing(
      [
        {
          id: "id-\u001b[2J",
          status: "signed\u0007",
          intent: { recipient: "0xfB69\u001b]0;pwned\u0007", amount: "7\u001b[31m" },
        },
      ],
      // HTTP refuses C0 controls in a header, but lets C1 ones such as CSI through.
      "next-\u009b2Jtoken",
    );

    const { stdout } = await intents();

    for (const sequence of ["\u001b[2J", "\u001b]0", "\u0007", "\u001b[31m", "\u009b"]) {
      expect(stdout).not.toContain(sequence);
    }
    expect(stdout).toContain("id-[2J");
    expect(stdout).toContain("More intents: next cursor next-2Jtoken");
  });

  it.each(["abc", "0x10", "-5", "1.5"])(
    "lists an intent whose amount %p isn't a base-unit integer, with no display amount",
    async amount => {
      listing([{ id: "odd", intent: { amount } }, { id: "plain" }]);

      const { json } = await intentsJson();

      expect(
        json.intents.map((i: Record<string, unknown>) => [i.id, i.amount, i.displayAmount]),
      ).toEqual([
        ["odd", amount, null],
        ["plain", "10000000000000000", "0.01 ETH"],
      ]);
    },
  );

  it("reports an empty page as success", async () => {
    listing([]);

    const { stdout, exitCode } = await intents();
    expect(exitCode).toBe(0);
    expect(stdout).toContain('No intents for profile "bot".');

    const { json } = await intentsJson();
    expect(json).toMatchObject({ status: "success", count: 0, intents: [], nextCursor: null });
  });

  it("rejects a profile that is not enrolled", async () => {
    const pending = await makeEnrolledProfile({ profile: { trustchainId: undefined } });
    try {
      const { stdout, exitCode } = await runCli(
        ["agent-intent", "intents", "--profile", "bot", "--output", "json"],
        { ...pending.env, WALLET_CLI_MOCK_PORT: String(server.port) },
      );

      expect(exitCode).toBe(1);
      expect(JSON.parse(stdout).error.message).toMatch(/is not enrolled yet/);
      expect(service.requests).toEqual([]);
    } finally {
      pending.cleanup();
    }
  });

  it.each([
    [400, "invalid_cursor", /Check --status and --page-size; a --cursor only works/],
    [429, undefined, /rate-limiting requests/],
    [503, undefined, /HTTP 503.*Re-run the command later/],
    [403, "not_a_member", /not an active agent on its Trustchain/],
  ])("turns HTTP %d %s into an actionable error", async (status, type, message) => {
    service.reply("listIntents", {
      status,
      json: { message: "detail", ...(type ? { type } : {}) },
    });

    const { json, exitCode } = await intentsJson();

    expect(exitCode).toBe(1);
    expect(json.error.message).toMatch(message);
  });

  it("never prints the agent secret key", async () => {
    listing([{}]);

    const json = await intents("--output", "json");
    const human = await intents();

    const printed = [json.stdout, json.stderr, human.stdout, human.stderr].join("");
    expect(printed).not.toContain(fixture.agent.exportSecretKey());
  });
});
