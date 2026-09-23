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

describe("agent-intent list", () => {
  let restore: () => void;
  let stderrChunks: string[];

  beforeEach(() => {
    profiles = [];
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

  it("prints no warning when every profile loaded cleanly", async () => {
    await runList();
    expect(stderrChunks.join("")).toBe("");
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
