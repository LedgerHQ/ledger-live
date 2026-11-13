import { describe, expect, it } from "bun:test";
import { makeProfilesDir, profileRecord } from "../../testing/agent-intent-profile-records";
import { runCli } from "../../testing/cli-runner";

async function show(records: readonly unknown[], profileId: string, ...args: string[]) {
  const dir = makeProfilesDir(records);
  try {
    return await runCli(["agent-intent", "show", "--profile", profileId, ...args], dir.env);
  } finally {
    dir.cleanup();
  }
}

async function showJson(records: readonly unknown[], profileId: string) {
  const run = await show(records, profileId, "--output", "json");
  return { ...run, json: JSON.parse(run.stdout) };
}

describe("agent-intent show (CLI)", () => {
  it("shows the profile's detail and no warning when it loads cleanly", async () => {
    const { stdout, stderr, exitCode } = await show(
      [profileRecord("good-agent", { trustchainId: "tc-1" })],
      "good-agent",
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Profile:        good-agent");
    expect(stdout).toContain("Status:         enrolled");
    expect(stdout).toContain("Trustchain ID:  tc-1");
    expect(stderr).toBe("");
  });

  it("reports the profile as JSON with its status and fingerprint", async () => {
    const { json, exitCode } = await showJson([profileRecord("good-agent")], "good-agent");

    expect(exitCode).toBe(0);
    expect(json).toMatchObject({
      status: "success",
      command: "agent-intent show",
      profile: { profileId: "good-agent", profileStatus: "pending", keyStore: "os-keychain" },
    });
    expect(json.profile.fingerprint).toEqual(expect.any(String));
  });

  it("rejects a profile id that never existed", async () => {
    const { json, exitCode } = await showJson([profileRecord("good-agent")], "never-existed");

    expect(exitCode).toBe(1);
    expect(json.error.message).toBe('No Agent Intent profile named "never-existed".');
  });

  it("gives a distinct error for a profile id that failed to load, instead of claiming it never existed", async () => {
    const { json, exitCode } = await showJson([{ profileId: "broken-agent" }], "broken-agent");

    expect(exitCode).toBe(1);
    expect(json.error.message).toMatch(/"broken-agent" failed to load \(invalid session record\)/);
  });

  it("warns about other invalid profiles in the session while showing this one", async () => {
    const { stdout, stderr, exitCode } = await show(
      [profileRecord("good-agent"), { profileId: "some-other-broken-one" }],
      "good-agent",
    );

    expect(exitCode).toBe(0);
    expect(stderr).toContain("some-other-broken-one");
    expect(stdout).toContain("Profile:        good-agent");
  });
});
