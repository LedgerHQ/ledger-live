import { describe, expect, it } from "bun:test";
import { makeProfilesDir, profileRecord } from "../../testing/agent-intent-profile-records";
import { runCli } from "../../testing/cli-runner";

async function list(records: readonly unknown[], ...args: string[]) {
  const dir = makeProfilesDir(records);
  try {
    return await runCli(["agent-intent", "list", ...args], dir.env);
  } finally {
    dir.cleanup();
  }
}

describe("agent-intent list (CLI)", () => {
  it("lists every profile independently, each with its own environment and status", async () => {
    const { stdout, exitCode } = await list(
      [
        profileRecord("bot-pending"),
        profileRecord("bot-enrolled", { environment: "production", trustchainId: "tc-1" }),
        profileRecord("bot-expired", {
          enrollmentExpiresAt: new Date(Date.now() - 60_000).toISOString(),
        }),
      ],
      "--output",
      "json",
    );

    expect(exitCode).toBe(0);
    expect(
      JSON.parse(stdout).profiles.map((p: Record<string, unknown>) => [
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

  it("prints a table and no warning when every profile loaded cleanly", async () => {
    const { stdout, stderr, exitCode } = await list([
      profileRecord("bot", { trustchainId: "tc-1" }),
    ]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("PROFILE");
    expect(stdout).toMatch(/bot\s+Agent bot {2}openclaw {2}staging {2}enrolled {2}os-keychain/);
    expect(stderr).toBe("");
  });

  it("tells how to add a profile when there is none", async () => {
    const { stdout, exitCode } = await list([]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("No Agent Intent profiles. Run `agent-intent enroll` first.");
  });

  it("warns on stderr about profiles that failed to load, naming their ids, and lists the rest", async () => {
    const { stdout, stderr, exitCode } = await list([
      { profileId: "broken-1" },
      profileRecord("bot"),
      profileRecord("broken-2", { publicKey: "not-a-key" }),
    ]);

    expect(exitCode).toBe(0);
    expect(stderr).toContain("broken-1, broken-2");
    expect(stderr).toContain("failed to load");
    expect(stderr).toContain("ignored until it is fixed");
    expect(stderr).toContain("session.yaml");
    expect(stdout).toContain("Agent bot");
  });
});
