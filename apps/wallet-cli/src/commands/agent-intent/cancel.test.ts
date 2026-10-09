import "../../live-common-setup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { AgentIntentHttpError, type AgentIntentRecord } from "@ledgerhq/agent-intent-sdk";
import { installOutputCapture } from "../../shared/ui";
import {
  activateAgentIntentMocks,
  deactivateAgentIntentMocks,
  realAgentIntentSdk,
} from "./__test-helpers__/agent-intent-mocks";

const agent = realAgentIntentSdk.createSoftwareAgentIdentity();
const SECRET_KEY = agent.exportSecretKey();

const SENDER = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
const RECIPIENT = "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359";
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

function record(status: string): AgentIntentRecord {
  return {
    id: INTENT_ID,
    agentPubkey: agent.publicKey,
    status,
    createdAt: "2026-10-07T10:00:00Z",
    updatedAt: "2026-10-07T10:05:00Z",
    intent: {
      type: "send",
      network: "ethereum",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: "10000000000000000",
      asset: { type: "native" },
      feeStrategy: "medium",
    },
  };
}

let profiles: Record<string, unknown>;
let secretKeyReads: number;
/** What the service answers to each successive read: a status, or an error to throw. */
let readStatuses: (string | Error)[];
let reads: string[];
let readError: Error | undefined;
let cancelImpl: (intentId: string) => Promise<void>;
let cancels: string[];
let canAsk: boolean;
let answer: boolean;
let questions: string[];
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
          reads.push(intentId);
          if (readError) throw readError;
          const next = readStatuses.length > 1 ? readStatuses.shift()! : readStatuses[0];
          if (next instanceof Error) throw next;
          return record(next);
        },
        cancelIntent: async (intentId: string) => {
          cancels.push(intentId);
          return cancelImpl(intentId);
        },
      }),
    },
    tokenLookup: { findEthereumToken: async () => null },
    confirmPrompt: {
      canAskToConfirm: () => canAsk,
      askToConfirm: async (question: string) => {
        questions.push(question);
        return answer;
      },
    },
  }),
);
afterAll(() => deactivateAgentIntentMocks());

const { default: cancelCommand } = await import("./cancel");

type CancelFlags = { profile: string; intent: string; yes: boolean; output?: "human" | "json" };

function runCancel(overrides: Partial<CancelFlags> = {}) {
  const flags: CancelFlags = { profile: "bot", intent: INTENT_ID, yes: true, ...overrides };
  return (
    cancelCommand as unknown as { handler: (a: { flags: CancelFlags }) => Promise<void> }
  ).handler({ flags });
}

function jsonResult(): Record<string, unknown> {
  return JSON.parse(stdout.join("").trim().split("\n").at(-1) ?? "{}");
}

describe("agent-intent cancel", () => {
  let restore: () => void;

  beforeEach(() => {
    profiles = { bot: enrolledProfile };
    secretKeyReads = 0;
    readStatuses = ["crafted", "cancelled"];
    reads = [];
    readError = undefined;
    cancelImpl = async () => {};
    cancels = [];
    canAsk = false;
    answer = false;
    questions = [];
    stdout = [];
    stderr = [];
    restore = installOutputCapture({
      stdout: chunk => stdout.push(chunk),
      stderr: chunk => stderr.push(chunk),
    });
  });

  afterEach(() => restore());

  it("cancels with --yes and reports the service's state as stable JSON", async () => {
    await runCancel({ output: "json" });

    expect(cancels).toEqual([INTENT_ID]);
    expect(reads).toEqual([INTENT_ID, INTENT_ID]);
    expect(questions).toEqual([]);
    expect(jsonResult()).toMatchObject({
      status: "success",
      command: "agent-intent cancel",
      profileId: "bot",
      cancelled: true,
      alreadyCancelled: false,
      intent: { id: INTENT_ID, status: "cancelled", amount: "10000000000000000" },
    });
  });

  it("confirms a cancellation in human output", async () => {
    await runCancel();

    const text = stdout.join("");
    expect(text).toContain(`Intent ${INTENT_ID} cancelled. The user can no longer sign it.`);
    expect(text).toContain("Status:  cancelled (final)");
  });

  it("shows the intent and asks before cancelling when no --yes is given", async () => {
    canAsk = true;
    answer = true;

    await runCancel({ yes: false });

    expect(questions).toEqual(["Cancel this intent? This can't be undone. [y/N] "]);
    expect(stderr.join("")).toContain(`Intent:  ${INTENT_ID}`);
    expect(stderr.join("")).toContain("Amount:  0.01 ETH");
    expect(cancels).toEqual([INTENT_ID]);
  });

  it("leaves the intent alone when the prompt is declined", async () => {
    canAsk = true;
    readStatuses = ["crafted"];

    await runCancel({ yes: false, output: "json" });

    expect(cancels).toEqual([]);
    expect(jsonResult()).toMatchObject({
      profileId: "bot",
      cancelled: false,
      declined: true,
      intentId: INTENT_ID,
    });

    stdout = [];
    stderr = [];
    await runCancel({ yes: false });
    expect(stderr.join("")).toContain(`Not cancelled: intent ${INTENT_ID} is unchanged.`);
  });

  it("requires --yes when no one can answer a prompt, before signing in", async () => {
    await expect(runCancel({ yes: false })).rejects.toThrow(/Re-run with --yes/);

    expect(secretKeyReads).toBe(0);
    expect(reads).toEqual([]);
    expect(cancels).toEqual([]);
  });

  it("reports an intent that was already cancelled without cancelling it again", async () => {
    readStatuses = ["cancelled"];
    canAsk = true;

    await runCancel({ yes: false, output: "json" });

    expect(questions).toEqual([]);
    expect(cancels).toEqual([]);
    expect(jsonResult()).toMatchObject({
      cancelled: true,
      alreadyCancelled: true,
      intent: { status: "cancelled" },
    });
  });

  it.each(["signed", "broadcast", "success", "failed", "rejected", "expired"])(
    "refuses a %s intent without asking or calling the service",
    async status => {
      readStatuses = [status];
      canAsk = true;

      await expect(runCancel({ yes: false })).rejects.toThrow(
        `Intent ${INTENT_ID} is ${status}, so it can't be cancelled`,
      );
      expect(questions).toEqual([]);
      expect(cancels).toEqual([]);
    },
  );

  it("lets the service decide on a state this version doesn't know", async () => {
    readStatuses = ["archived", "cancelled"];

    await runCancel({ output: "json" });

    expect(cancels).toEqual([INTENT_ID]);
    expect(jsonResult()).toMatchObject({ cancelled: true, intent: { status: "cancelled" } });
  });

  // The service answers an illegal transition with a bare 400, without an error type.
  it("reports the current state when the intent moved on before the cancellation", async () => {
    readStatuses = ["crafted", "signed"];
    cancelImpl = async () => {
      throw new AgentIntentHttpError("Illegal transition", 400);
    };

    await expect(runCancel()).rejects.toThrow(
      `Intent ${INTENT_ID} is signed, so it can't be cancelled`,
    );
    expect(cancels).toEqual([INTENT_ID]);
  });

  it("keeps the service's message for a 400 on an intent that is still cancellable", async () => {
    readStatuses = ["crafted"];
    cancelImpl = async () => {
      throw new AgentIntentHttpError("Malformed request", 400);
    };

    await expect(runCancel()).rejects.toThrow(
      `The Agent Intent service refused to cancel intent ${INTENT_ID} (HTTP 400: Malformed request).`,
    );
  });

  it("reports the cancellation even when its new state can't be read back", async () => {
    readStatuses = ["crafted", new Error("socket hang up")];

    await runCancel({ output: "json" });

    expect(cancels).toEqual([INTENT_ID]);
    expect(jsonResult()).toMatchObject({ cancelled: true, intent: { status: "cancelled" } });
    expect(stderr.join("")).toContain("Cancelled, but its new state could not be read back.");
  });

  it("answers a 404 while reading like an unknown id", async () => {
    readError = new AgentIntentHttpError("Intent not found", 404);

    await expect(runCancel()).rejects.toThrow(
      /has no intent .*doesn't exist, or another agent created it/,
    );
    expect(cancels).toEqual([]);
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
      cancelImpl = async () => {
        throw new AgentIntentHttpError("detail", status, type);
      };

      await expect(runCancel()).rejects.toThrow(message);
    },
  );

  it("normalizes the id and rejects a malformed one before touching the keychain", async () => {
    await runCancel({ intent: ` ${INTENT_ID.toUpperCase()} ` });
    expect(cancels).toEqual([INTENT_ID]);

    secretKeyReads = 0;
    await expect(runCancel({ intent: "intent-123" })).rejects.toThrow(/is not an intent id/);
    expect(secretKeyReads).toBe(0);
  });

  it("rejects a profile that is not enrolled", async () => {
    profiles = { bot: { ...enrolledProfile, trustchainId: undefined } };

    await expect(runCancel()).rejects.toThrow(/is not enrolled yet/);
    expect(cancels).toEqual([]);
  });

  it("never prints the agent secret key", async () => {
    await runCancel({ output: "json" });
    readStatuses = ["crafted", "cancelled"];
    await runCancel();

    expect(stdout.join("") + stderr.join("")).not.toContain(SECRET_KEY);
  });
});
