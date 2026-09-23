import { describe, expect, it } from "bun:test";
import { join } from "node:path";

/**
 * Opt-in staging integration test for `agent-intent send` — see ./README.md for prerequisites.
 * Skipped unless WALLET_CLI_AGENT_INTENT_STAGING_PROFILE is set, so CI never runs it. Runs the real
 * CLI as a subprocess against the real session, OS keychain, Keycloak/LKRP and Agent Intent BFF, and
 * leaves a real pending intent on staging for a human to reject.
 */
const profile = process.env.WALLET_CLI_AGENT_INTENT_STAGING_PROFILE;
const sender = process.env.WALLET_CLI_AGENT_INTENT_STAGING_SENDER;
const token = process.env.WALLET_CLI_AGENT_INTENT_STAGING_TOKEN;
const tokenAmount = process.env.WALLET_CLI_AGENT_INTENT_STAGING_TOKEN_AMOUNT;

const CLI = join(import.meta.dir, "..", "..", "cli.ts");
const STAGING_FRONTEND = "https://agent-intent.ledger-test.com/";

async function send(
  args: string[],
): Promise<{ exitCode: number; envelope: Record<string, unknown> }> {
  const proc = Bun.spawn(
    [process.execPath, "run", CLI, "agent-intent", "send", ...args, "--output", "json"],
    {
      stdout: "pipe",
      stderr: "inherit",
    },
  );
  const stdout = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;
  return { exitCode, envelope: JSON.parse(stdout.trim().split("\n").at(-1) ?? "{}") };
}

describe.skipIf(!profile)("agent-intent send against staging (opt-in)", () => {
  const base = ["--profile", profile ?? "", "--from", sender ?? "", "--to", sender ?? ""];

  it("creates a native ETH intent and returns a staging review link", async () => {
    const { exitCode, envelope } = await send([
      ...base,
      "--amount",
      "0.000001 ETH",
      "--description",
      "wallet-cli staging integration test — reject me",
    ]);

    expect(envelope).toMatchObject({ status: "success", submitted: true });
    expect(exitCode).toBe(0);
    expect(String(envelope.deeplink).startsWith(STAGING_FRONTEND)).toBe(true);
    expect(envelope.intentId).toEqual(expect.any(String));
  }, 60_000);

  it.skipIf(!token || !tokenAmount)(
    "creates an ERC-20 intent",
    async () => {
      const { exitCode, envelope } = await send([
        ...base,
        "--amount",
        tokenAmount ?? "",
        "--token",
        token ?? "",
      ]);

      expect(envelope).toMatchObject({ status: "success", submitted: true });
      expect(exitCode).toBe(0);
      expect(envelope.asset).toMatchObject({ type: "erc20" });
    },
    60_000,
  );
});
