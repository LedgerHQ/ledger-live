import "../../live-common-setup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { installOutputCapture } from "../../shared/ui";
import {
  activateAgentIntentMocks,
  deactivateAgentIntentMocks,
} from "./__test-helpers__/agent-intent-mocks";

let profile: Record<string, unknown> | undefined;
let invalidAgentIntentProfileIds: string[];

beforeAll(() =>
  activateAgentIntentMocks({
    sessionRead: async () => ({
      getAgentIntentProfile: (_profileId: string) => profile,
      invalidAgentIntentProfileIds,
    }),
  }),
);
afterAll(() => deactivateAgentIntentMocks());

const { default: showCommand } = await import("./show");

function makeProfile(profileId: string): Record<string, unknown> {
  return {
    profileId,
    displayName: "Test Agent",
    description: "Remote agent that proposes intents for review.",
    source: "openclaw",
    environment: "staging",
    bffBaseUrl: "https://global.api.stg.ledger-test.com/agent-intent",
    publicKey: "0236cb7ebc1a324bd02abac533f7904f9579cc581c772285fecc6f5157a960b076",
    enrollmentExpiresAt: "2026-06-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function runShow(profileId: string, output?: "human" | "json") {
  return (
    showCommand as unknown as {
      handler: (args: { flags: { profile: string; output?: "human" | "json" } }) => Promise<void>;
    }
  ).handler({ flags: { profile: profileId, output } });
}

describe("agent-intent show", () => {
  let restore: () => void;
  let stderrChunks: string[];

  beforeEach(() => {
    profile = undefined;
    invalidAgentIntentProfileIds = [];
    stderrChunks = [];
    restore = installOutputCapture({
      stdout: () => {},
      stderr: chunk => {
        stderrChunks.push(chunk);
      },
    });
  });

  afterEach(() => restore());

  it("rejects a profile id that never existed", async () => {
    await expect(runShow("never-existed")).rejects.toThrow(
      /No Agent Intent profile named "never-existed"/,
    );
  });

  it("gives a distinct error for a profile id that failed to load, instead of claiming it never existed", async () => {
    invalidAgentIntentProfileIds = ["broken-agent"];

    await expect(runShow("broken-agent")).rejects.toThrow(
      /"broken-agent" failed to load \(invalid session record\)/,
    );
  });

  it("shows the profile normally when it loads cleanly", async () => {
    profile = makeProfile("good-agent");

    await runShow("good-agent");

    expect(stderrChunks.join("")).toBe("");
  });

  it("warns about other invalid profiles in the session even while successfully showing this one", async () => {
    profile = makeProfile("good-agent");
    invalidAgentIntentProfileIds = ["some-other-broken-one"];

    await runShow("good-agent");

    expect(stderrChunks.join("")).toContain("some-other-broken-one");
  });
});
