import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { AGENT_INTENT_STATUSES, buildAttestation } from "@ledgerhq/agent-intent-sdk";
import { isTerminalIntentStatus } from "../../agent-intent/intent-list";
import {
  FakeAgentIntentService,
  intentRecord,
  makeEnrolledProfile,
  type EnrolledProfile,
  type ServiceReply,
} from "../../testing/agent-intent-service";
import { CAL_KNOWS_USDC, USDC_CONTRACT, USDC_MINT } from "../../testing/agent-intent-cal-routes";
import { KEYCLOAK_TOKEN } from "../../testing/auth-routes";
import { useFreshCalCache } from "../../testing/cal-cache";
import { runCli } from "../../testing/cli-runner";
import { MockServer } from "../../testing/mock-server";

const INTENT_ID = "0192f7a4-0000-7000-8000-000000000001";
const SENDER = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
const RECIPIENT = "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359";

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

function intent(overrides: Parameters<typeof intentRecord>[1] = {}): ServiceReply {
  return { json: intentRecord(fixture.agent.publicKey, overrides) };
}

function status(...args: string[]) {
  return runCli(
    ["agent-intent", "status", "--profile", "bot", "--intent", INTENT_ID, ...args],
    env,
  );
}

async function statusJson(...args: string[]) {
  const run = await status(...args, "--output", "json");
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

describe("agent-intent status (CLI)", () => {
  it("signs in as the profile's agent and reports the intent as JSON with an exact amount", async () => {
    service.reply("getIntent", intent());

    const { json, exitCode, stderr } = await statusJson();

    expect(exitCode, stderr).toBe(0);
    expect(json).toMatchObject({
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
    expect(service.requests.map(r => [r.endpoint, r.intentId, r.authorization])).toEqual([
      ["getIntent", INTENT_ID, `Bearer ${KEYCLOAK_TOKEN}`],
    ]);
    expect(service.signIns).toEqual([
      {
        publicKey: fixture.agent.publicKey,
        attestation: buildAttestation(fixture.trustchainId),
        signatureValid: true,
      },
    ]);
  });

  it.each(AGENT_INTENT_STATUSES.map(s => [s]))(
    "renders the %s state, flagging final ones for polling",
    async state => {
      service.reply("getIntent", intent({ status: state }));

      const { json } = await statusJson();
      expect(json).toMatchObject({
        terminal: isTerminalIntentStatus(state),
        intent: { status: state },
      });

      const { stdout } = await status();
      expect(stdout).toContain(`Status:  ${state}`);
    },
  );

  it("passes an unknown future state through with terminal null instead of failing", async () => {
    service.reply("getIntent", intent({ status: "archived" }));

    const { json, exitCode } = await statusJson();
    expect(exitCode).toBe(0);
    expect(json).toMatchObject({ terminal: null, intent: { status: "archived" } });

    const { stdout } = await status();
    expect(stdout).toContain("archived (unknown to this wallet-cli version)");
  });

  it("shows a swap's pair and provider", async () => {
    service.reply("getIntent", intent({ intent: SWAP }));

    const { json } = await statusJson();
    expect(json).toMatchObject({
      intent: { displayAmount: "0.5 ETH → ~1250 USDC", swap: { provider: "velora" } },
    });

    const { stdout } = await status();
    expect(stdout).toContain("Amount:  0.5 ETH → ~1250 USDC via velora");
  });

  it("shows a Solana SPL send in token units, with its memo", async () => {
    service.reply("getIntent", intent({ intent: SOLANA_USDC_SEND }));

    const { json } = await statusJson();
    expect(json).toMatchObject({
      intent: {
        network: "solana",
        amount: "2500000",
        displayAmount: "2.5 USDC",
        memo: "Invoice 42",
      },
    });

    const { stdout } = await status();
    expect(stdout).toContain(`Amount:  2.5 USDC (${USDC_MINT})\n`);
    expect(stdout).toContain("Network: solana");
    expect(stdout).toContain("Memo:    Invoice 42");
  });

  it("shows an intent type this version doesn't know with its common fields", async () => {
    service.reply("getIntent", intent({ intent: { ...SWAP, type: "stake", provider: undefined } }));

    const { json } = await statusJson();

    expect(json).toMatchObject({
      intent: { id: INTENT_ID, type: "stake", status: "signed", displayAmount: null, swap: null },
    });
  });

  it("shows why a failed intent failed", async () => {
    service.reply("getIntent", intent({ status: "failed", failureReason: "insufficient funds" }));

    const { stdout } = await status();

    expect(stdout).toContain("Failure: insufficient funds");
  });

  it("shows an ERC-20 amount in token units", async () => {
    service.reply(
      "getIntent",
      intent({
        intent: { amount: "2500000", asset: { type: "erc20", assetReference: USDC_CONTRACT } },
      }),
    );

    const { json } = await statusJson();

    expect(json).toMatchObject({ intent: { displayAmount: "2.5 USDC" } });
  });

  it("falls back to base units for an ERC-20 contract CAL doesn't know", async () => {
    service.reply(
      "getIntent",
      intent({
        intent: {
          amount: "2500000",
          asset: { type: "erc20", assetReference: "0x0000000000000000000000000000000000000001" },
        },
      }),
    );

    const { stdout } = await status();

    expect(stdout).toContain("Amount:  2500000 (base units)");
  });

  it("strips terminal control sequences from what the service returns", async () => {
    service.reply(
      "getIntent",
      intent({
        status: "failed",
        failureReason: "out of \u001b]0;pwned\u0007gas",
        intent: { description: "Pay \u001b[2Jsupplier\u009b" },
      }),
    );

    const { stdout } = await status();

    expect(stdout).toContain("Note:    Pay [2Jsupplier");
    expect(stdout).toContain("Failure: out of ]0;pwnedgas");
    for (const control of ["\u001b", "\u0007", "\u009b"]) expect(stdout).not.toContain(control);
  });

  it("normalizes the id it is given", async () => {
    service.reply("getIntent", intent());

    await runCli(
      ["agent-intent", "status", "--profile", "bot", "--intent", ` ${INTENT_ID.toUpperCase()} `],
      env,
    );

    expect(service.calls("getIntent").map(r => r.intentId)).toEqual([INTENT_ID]);
  });

  it("rejects a malformed id before reading the agent key", async () => {
    fixture.keychain.readError = new Error("the agent key was read");

    const { stdout, exitCode } = await runCli(
      ["agent-intent", "status", "--profile", "bot", "--intent", "intent-123", "--output", "json"],
      env,
    );

    expect(exitCode).toBe(1);
    expect(JSON.parse(stdout).error.message).toMatch(/is not an intent id/);
    expect(service.requests).toEqual([]);
    expect(service.signIns).toEqual([]);
  });

  it("rejects a profile that is not enrolled", async () => {
    const pending = await makeEnrolledProfile({ profile: { trustchainId: undefined } });
    try {
      const { stdout, exitCode } = await runCli(
        ["agent-intent", "status", "--profile", "bot", "--intent", INTENT_ID, "--output", "json"],
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
    [404, undefined, /has no intent .*doesn't exist, or another agent created it/],
    [400, undefined, /rejected intent id/],
    [403, "unexpected_caller", /doesn't let agents read a single intent yet/],
    [403, "not_a_member", /not an active agent on its Trustchain/],
    [401, "token_expired", /Authentication with the Agent Intent service failed/],
    [429, undefined, /rate-limiting requests/],
    [503, undefined, /HTTP 503.*Re-run the command later/],
  ])("turns HTTP %d %s into an actionable error", async (code, type, message) => {
    service.reply("getIntent", {
      status: code,
      json: { message: "detail", ...(type ? { type } : {}) },
    });

    const { json, exitCode } = await statusJson();

    expect(exitCode).toBe(1);
    expect(json.error.message).toMatch(message);
  });

  it("reports a connection dropped mid-response as unreachable", async () => {
    const dropping = new MockServer([
      {
        method: "GET",
        match: new RegExp(`/intents/${INTENT_ID}$`),
        response: null,
        onRequest: () =>
          new Response(
            new ReadableStream({ start: c => c.error(new Error("dropped by the test")) }),
          ),
      },
      ...service.routes,
    ]);
    dropping.start();
    try {
      const { stdout, exitCode } = await runCli(
        ["agent-intent", "status", "--profile", "bot", "--intent", INTENT_ID, "--output", "json"],
        { ...env, WALLET_CLI_MOCK_PORT: String(dropping.port) },
      );

      expect(exitCode).toBe(1);
      expect(JSON.parse(stdout).error.message).toMatch(/Could not reach the Agent Intent service/);
    } finally {
      dropping.stop();
    }
  });

  it("never prints the agent secret key", async () => {
    service.reply("getIntent", intent());

    const json = await status("--output", "json");
    const human = await status();

    const printed = [json.stdout, json.stderr, human.stdout, human.stderr].join("");
    expect(printed).not.toContain(fixture.agent.exportSecretKey());
  });
});
