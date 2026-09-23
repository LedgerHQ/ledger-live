import "../../live-common-setup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { installOutputCapture } from "../../shared/ui";
import {
  activateAgentIntentMocks,
  deactivateAgentIntentMocks,
} from "./__test-helpers__/agent-intent-mocks";

let profiles: Record<string, unknown>[];
let invalidAgentIntentProfileIds: string[];

beforeAll(() =>
  activateAgentIntentMocks({
    sessionRead: async () => ({ agentIntentProfiles: profiles, invalidAgentIntentProfileIds }),
  }),
);
afterAll(() => deactivateAgentIntentMocks());

const { default: listCommand } = await import("./list");

function runList(output?: "human" | "json") {
  return (
    listCommand as unknown as {
      handler: (args: { flags: { output?: "human" | "json" } }) => Promise<void>;
    }
  ).handler({ flags: { output } });
}

function profile(profileId: string, extra: Record<string, unknown>) {
  return {
    profileId,
    displayName: `Agent ${profileId}`,
    description: "Remote agent that proposes intents for review.",
    source: "openclaw",
    environment: "staging",
    bffBaseUrl: "https://global.api.stg.ledger-test.com/agent-intent",
    publicKey: "0236cb7ebc1a324bd02abac533f7904f9579cc581c772285fecc6f5157a960b076",
    enrollmentExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    createdAt: new Date().toISOString(),
    ...extra,
  };
}

describe("agent-intent list", () => {
  let restore: () => void;
  let stderrChunks: string[];
  let stdoutChunks: string[];

  beforeEach(() => {
    profiles = [];
    invalidAgentIntentProfileIds = [];
    stderrChunks = [];
    stdoutChunks = [];
    restore = installOutputCapture({
      stdout: chunk => {
        stdoutChunks.push(chunk);
      },
      stderr: chunk => {
        stderrChunks.push(chunk);
      },
    });
  });

  afterEach(() => restore());

  it("prints no warning when every profile loaded cleanly", async () => {
    await runList();
    expect(stderrChunks.join("")).toBe("");
  });

  it("lists every profile independently, each with its own environment and status", async () => {
    profiles = [
      profile("bot-pending", {}),
      profile("bot-enrolled", { environment: "production", trustchainId: "tc-1" }),
      profile("bot-expired", { enrollmentExpiresAt: new Date(Date.now() - 60_000).toISOString() }),
    ];

    await runList("json");

    const envelope = JSON.parse(stdoutChunks.join(""));
    expect(
      envelope.profiles.map((p: Record<string, unknown>) => [
        p.profileId,
        p.environment,
        p.profileStatus,
      ]),
    ).toEqual([
      ["bot-pending", "staging", "pending"],
      ["bot-enrolled", "production", "enrolled"],
      ["bot-expired", "staging", "expired"],
    ]);
  });

  it("warns on stderr about profiles that failed to load, naming their ids", async () => {
    invalidAgentIntentProfileIds = ["broken-1", "broken-2"];

    await runList();

    const warning = stderrChunks.join("");
    expect(warning).toContain("broken-1, broken-2");
    expect(warning).toContain("failed to load");
    expect(warning).toContain("orphaning its OS-keychain secret");
    expect(warning).toContain("session.yaml");
  });
});
