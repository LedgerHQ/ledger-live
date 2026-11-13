import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { buildAttestation } from "@ledgerhq/agent-intent-sdk";
import { _setTestConfirmPrompt } from "../../agent-intent/confirm-prompt";
import {
  CAL_KNOWS_NO_TOKENS,
  FakeAgentIntentService,
  intentRecord,
  makeEnrolledProfile,
  type EnrolledProfile,
  type ServiceReply,
} from "../../testing/agent-intent-service";
import { KEYCLOAK_TOKEN } from "../../testing/auth-routes";
import { runCli } from "../../testing/cli-runner";
import { FakeConfirmPrompt } from "../../testing/fake-confirm-prompt";
import { MockServer } from "../../testing/mock-server";

const INTENT_ID = "0192f7a4-0000-7000-8000-000000000001";
const PROMPT = "Cancel this intent? This can't be undone. [y/N] ";

const service = new FakeAgentIntentService();
const server = new MockServer([...service.routes, CAL_KNOWS_NO_TOKENS]);
let fixture: EnrolledProfile;
let env: Record<string, string>;

beforeAll(async () => {
  server.start();
  fixture = await makeEnrolledProfile();
  env = { ...fixture.env, WALLET_CLI_MOCK_PORT: String(server.port) };
});
afterAll(() => {
  fixture.cleanup();
  server.stop();
});
beforeEach(() => service.reset());
afterEach(() => {
  _setTestConfirmPrompt(null);
  fixture.keychain.readError = undefined;
});

/** The intent as the service reads it back, in `status`. */
function intent(status: string, overrides: Parameters<typeof intentRecord>[1] = {}): ServiceReply {
  return { json: intentRecord(fixture.agent.publicKey, { status, ...overrides }) };
}

const httpError = (status: number, message: string, type?: string): ServiceReply => ({
  status,
  json: { message, ...(type ? { type } : {}) },
});

function cancel(...args: string[]) {
  return runCli(
    ["agent-intent", "cancel", "--profile", "bot", "--intent", INTENT_ID, ...args],
    env,
  );
}

async function cancelJson(...args: string[]) {
  const run = await cancel(...args, "--output", "json");
  return { ...run, json: JSON.parse(run.stdout) };
}

function answerPrompt(answer: boolean): FakeConfirmPrompt {
  const prompt = new FakeConfirmPrompt(answer);
  _setTestConfirmPrompt(prompt);
  return prompt;
}

describe("agent-intent cancel (CLI)", () => {
  it("signs in as the profile's agent, cancels with --yes and reports the new state as JSON", async () => {
    service.reply("getIntent", intent("crafted"), intent("cancelled")).reply("cancelIntent", {
      status: 204,
    });

    const { json, exitCode, stderr } = await cancelJson("--yes");

    expect(exitCode, stderr).toBe(0);
    expect(json).toMatchObject({
      status: "success",
      command: "agent-intent cancel",
      profileId: "bot",
      cancelled: true,
      alreadyCancelled: false,
      readBack: true,
      intent: { id: INTENT_ID, status: "cancelled", amount: "10000000000000000" },
    });
    expect(service.requests.map(r => [r.endpoint, r.intentId])).toEqual([
      ["getIntent", INTENT_ID],
      ["cancelIntent", INTENT_ID],
      ["getIntent", INTENT_ID],
    ]);
    expect(service.requests.every(r => r.authorization === `Bearer ${KEYCLOAK_TOKEN}`)).toBe(true);
    expect(service.signIns).toEqual([
      {
        publicKey: fixture.agent.publicKey,
        attestation: buildAttestation(fixture.trustchainId),
        signatureValid: true,
      },
    ]);
  });

  it("confirms the cancellation in human output", async () => {
    service.reply("getIntent", intent("crafted"), intent("cancelled")).reply("cancelIntent", {});

    const { stdout, exitCode } = await cancel("--yes");

    expect(exitCode).toBe(0);
    expect(stdout).toContain(`Intent ${INTENT_ID} cancelled. The user can no longer sign it.`);
    expect(stdout).toContain("Status:  cancelled (final)");
  });

  it("shows a swap's pair and provider", async () => {
    const swap = {
      intent: {
        type: "swap",
        fromAsset: "ethereum",
        toAsset: "ethereum/erc20/usd__coin",
        fromAmount: "0.5",
        toAmount: "1250",
        provider: "velora",
      },
    };
    service
      .reply("getIntent", intent("crafted", swap), intent("cancelled", swap))
      .reply("cancelIntent", {});

    const { stdout } = await cancel("--yes");

    expect(stdout).toContain("Amount:  0.5 ETH → ~1250 ethereum/erc20/usd__coin via velora");
  });

  it("shows a Solana send's amount and memo", async () => {
    const solanaSend = {
      intent: {
        network: "solana",
        sender: "29d2S7vB453rNYFdR5Ycwt7y9haRT5fwVwL9zTmBhfV2",
        recipient: "3JF3sEqM796hk5WFqA6EtmEwJQ9quALszsfJyvXNQKy3",
        amount: "500000000",
        feeStrategy: undefined,
        memo: "Invoice 42",
      },
    };
    service
      .reply("getIntent", intent("crafted", solanaSend), intent("cancelled", solanaSend))
      .reply("cancelIntent", {});

    const { json } = await cancelJson("--yes");

    expect(json).toMatchObject({
      intent: { displayAmount: "0.5 SOL", memo: "Invoice 42", swap: null },
    });
  });

  it("shows the intent and asks before cancelling when no --yes is given", async () => {
    const prompt = answerPrompt(true);
    service.reply("getIntent", intent("crafted"), intent("cancelled")).reply("cancelIntent", {});

    const { stderr, exitCode } = await cancel();

    expect(exitCode).toBe(0);
    expect(prompt.questions).toEqual([PROMPT]);
    expect(stderr).toContain(`Intent:  ${INTENT_ID}`);
    expect(stderr).toContain("Amount:  0.01 ETH");
    expect(service.calls("cancelIntent")).toHaveLength(1);
  });

  it("strips terminal control characters from the intent it asks about", async () => {
    answerPrompt(true);
    const tampered = { intent: { description: "pay rent\u001b[2K\rIntent:  someone else" } };
    service
      .reply("getIntent", intent("crafted", tampered), intent("cancelled"))
      .reply("cancelIntent", {});

    const { stderr } = await cancel();

    expect(stderr).toContain("Note:    pay rent[2KIntent:  someone else");
    expect(stderr).not.toContain("\u001b");
    expect(stderr).not.toContain("\r");
  });

  it("leaves the intent alone when the prompt is declined", async () => {
    answerPrompt(false);
    service.reply("getIntent", intent("crafted"));

    const { json, exitCode } = await cancelJson();
    expect(exitCode).toBe(0);
    expect(json).toMatchObject({
      profileId: "bot",
      cancelled: false,
      declined: true,
      intentId: INTENT_ID,
    });

    const { stderr } = await cancel();
    expect(stderr).toContain(`Not cancelled: intent ${INTENT_ID} is unchanged.`);
    expect(service.calls("cancelIntent")).toEqual([]);
  });

  it("requires --yes when no one can answer a prompt, before reading the agent key", async () => {
    fixture.keychain.readError = new Error("the agent key was read");

    const { json, exitCode } = await cancelJson();

    expect(exitCode).toBe(1);
    expect(json.error.message).toMatch(/Re-run with --yes/);
    expect(service.requests).toEqual([]);
    expect(service.signIns).toEqual([]);
  });

  it("reports an intent that was already cancelled without asking or cancelling again", async () => {
    const prompt = answerPrompt(true);
    service.reply("getIntent", intent("cancelled"));

    const { json } = await cancelJson();

    expect(prompt.questions).toEqual([]);
    expect(service.calls("cancelIntent")).toEqual([]);
    expect(json).toMatchObject({
      cancelled: true,
      alreadyCancelled: true,
      intent: { status: "cancelled" },
    });
  });

  it.each(["signed", "broadcast", "success", "failed", "rejected", "expired"])(
    "refuses a %s intent without asking or calling the service",
    async status => {
      const prompt = answerPrompt(true);
      service.reply("getIntent", intent(status));

      const { json, exitCode } = await cancelJson();

      expect(exitCode).toBe(1);
      expect(json.error.message).toContain(
        `Intent ${INTENT_ID} is ${status}, so it can't be cancelled`,
      );
      expect(prompt.questions).toEqual([]);
      expect(service.calls("cancelIntent")).toEqual([]);
    },
  );

  it("lets the service decide on a state this version doesn't know", async () => {
    service.reply("getIntent", intent("archived"), intent("cancelled")).reply("cancelIntent", {});

    const { json } = await cancelJson("--yes");

    expect(service.calls("cancelIntent")).toHaveLength(1);
    expect(json).toMatchObject({ cancelled: true, intent: { status: "cancelled" } });
  });

  it("flags a state this version doesn't know in the preview and the result", async () => {
    answerPrompt(true);
    service.reply("getIntent", intent("archived")).reply("cancelIntent", {});

    const { stdout, stderr } = await cancel();

    expect(stderr).toContain("Status:  archived (unknown to this wallet-cli version)");
    expect(stdout).toContain("Status:  archived (unknown to this wallet-cli version)");
    expect(stdout).not.toContain("(final)");
  });

  // The service answers an illegal transition with a bare 400, without an error type.
  it("reports the current state when the intent moved on before the cancellation", async () => {
    service
      .reply("getIntent", intent("crafted"), intent("signed"))
      .reply("cancelIntent", httpError(400, "Illegal transition"));

    const { json, exitCode } = await cancelJson("--yes");

    expect(exitCode).toBe(1);
    expect(json.error.message).toContain(`Intent ${INTENT_ID} is signed, so it can't be cancelled`);
  });

  it.each(["crafted", "archived"])(
    "keeps the service's message for a 400 on a %s intent, which may still be cancellable",
    async status => {
      service
        .reply("getIntent", intent(status))
        .reply("cancelIntent", httpError(400, "Malformed request"));

      const { json } = await cancelJson("--yes");

      expect(json.error.message).toBe(
        `The Agent Intent service refused to cancel intent ${INTENT_ID} (HTTP 400: Malformed request).`,
      );
    },
  );

  it("reports success when another cancel got there first", async () => {
    service
      .reply("getIntent", intent("crafted"), intent("cancelled"))
      .reply("cancelIntent", httpError(400, "Illegal transition"));

    const { json, exitCode } = await cancelJson("--yes");

    expect(exitCode).toBe(0);
    expect(json).toMatchObject({
      status: "success",
      cancelled: true,
      alreadyCancelled: true,
      intent: { status: "cancelled" },
    });
  });

  it("reports the cancellation even when its new state can't be read back", async () => {
    service
      .reply("getIntent", intent("crafted"), httpError(503, "Service Unavailable"))
      .reply("cancelIntent", {});

    const { json, exitCode, stderr } = await cancelJson("--yes");

    expect(exitCode).toBe(0);
    expect(json).toMatchObject({
      cancelled: true,
      readBack: false,
      intent: { status: "cancelled" },
    });
    expect(stderr).toContain("Cancelled, but its new state could not be read back.");
  });

  it("strips terminal control characters from the id the service echoes back", async () => {
    const echoed = { id: `${INTENT_ID}\u001b[2K\r` };
    service
      .reply("getIntent", intent("crafted", echoed), intent("cancelled", echoed))
      .reply("cancelIntent", {});

    const { stdout } = await cancel("--yes");

    expect(stdout).toContain(`Intent ${INTENT_ID}[2K cancelled.`);
    expect(stdout).not.toContain("\u001b");
    expect(stdout).not.toContain("\r");
  });

  it("answers a 404 while reading like an unknown id", async () => {
    service.reply("getIntent", httpError(404, "Intent not found"));

    const { json, exitCode } = await cancelJson("--yes");

    expect(exitCode).toBe(1);
    expect(json.error.message).toMatch(
      /has no intent .*doesn't exist, or another agent created it/,
    );
    expect(service.calls("cancelIntent")).toEqual([]);
  });

  it.each([
    [404, undefined, /doesn't let agents cancel intents yet/],
    [405, undefined, /doesn't let agents cancel intents yet/],
    [403, "not_a_member", /not an active agent on its Trustchain/],
    [429, undefined, /rate-limiting requests/],
    [503, undefined, /HTTP 503.*Re-run the command later/],
    [409, undefined, /refused to cancel intent .*\(HTTP 409: detail\)/],
  ])(
    "turns HTTP %d %s from the cancellation into an actionable error",
    async (status, type, message) => {
      service
        .reply("getIntent", intent("crafted"))
        .reply("cancelIntent", httpError(status, "detail", type));

      const { json, exitCode } = await cancelJson("--yes");

      expect(exitCode).toBe(1);
      expect(json.error.message).toMatch(message);
    },
  );

  it("normalizes the id it is given", async () => {
    service.reply("getIntent", intent("crafted"), intent("cancelled")).reply("cancelIntent", {});

    await runCli(
      [
        "agent-intent",
        "cancel",
        "--profile",
        "bot",
        "--intent",
        ` ${INTENT_ID.toUpperCase()} `,
        "--yes",
      ],
      env,
    );

    expect(service.calls("cancelIntent").map(r => r.intentId)).toEqual([INTENT_ID]);
  });

  it("rejects a malformed id before reading the agent key", async () => {
    fixture.keychain.readError = new Error("the agent key was read");

    const { stdout, exitCode } = await runCli(
      [
        "agent-intent",
        "cancel",
        "--profile",
        "bot",
        "--intent",
        "intent-123",
        "--yes",
        "--output",
        "json",
      ],
      env,
    );

    expect(exitCode).toBe(1);
    expect(JSON.parse(stdout).error.message).toMatch(/is not an intent id/);
    expect(service.requests).toEqual([]);
  });

  it("rejects a profile that is not enrolled", async () => {
    const pending = await makeEnrolledProfile({ profile: { trustchainId: undefined } });
    try {
      const { stdout, exitCode } = await runCli(
        [
          "agent-intent",
          "cancel",
          "--profile",
          "bot",
          "--intent",
          INTENT_ID,
          "--yes",
          "--output",
          "json",
        ],
        { ...pending.env, WALLET_CLI_MOCK_PORT: String(server.port) },
      );

      expect(exitCode).toBe(1);
      expect(JSON.parse(stdout).error.message).toMatch(/is not enrolled yet/);
      expect(service.requests).toEqual([]);
    } finally {
      pending.cleanup();
    }
  });

  it("never prints the agent secret key", async () => {
    service.reply("getIntent", intent("crafted"), intent("cancelled")).reply("cancelIntent", {});

    const json = await cancel("--yes", "--output", "json");
    const human = await cancel("--yes");

    const printed = [json.stdout, json.stderr, human.stdout, human.stderr].join("");
    expect(printed).not.toContain(fixture.agent.exportSecretKey());
  });
});
