import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { YAML } from "bun";
import { createSoftwareAgentIdentity } from "@ledgerhq/agent-intent-sdk";
import { MockServer } from "../../helpers/mock-server";
import { runCli } from "../../helpers/cli-runner";
import { makeSessionDir } from "../../helpers/session-fixture";
import { USDT_API_RESPONSE, USDT_CONTRACT } from "../../helpers/cal-fixtures";
import { APP_NAME } from "../../../session/session-store";
import { toChecksumAddress } from "../../../agent-intent/evm";

// Contract test through the real CLI: flag parsing, session profile lookup and the CAL token lookup
// run for real. --dry-run keeps it off the OS keychain and the Agent Intent service.

const SENDER = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
const RECIPIENT = "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359";

const profile = {
  profileId: "bot",
  displayName: "Bot",
  description: "Remote agent that proposes intents for review.",
  source: "openclaw",
  environment: "staging",
  bffBaseUrl: "https://global.api.stg.ledger-test.com/agent-intent",
  publicKey: createSoftwareAgentIdentity().publicKey,
  trustchainId: "tc-1",
  enrollmentExpiresAt: new Date(Date.now() + 60_000).toISOString(),
  createdAt: new Date().toISOString(),
};

describe("agent-intent send (CLI, --dry-run)", () => {
  const server = new MockServer([
    {
      method: "GET",
      match: new RegExp(`contract_address=${USDT_CONTRACT}`, "i"),
      response: USDT_API_RESPONSE,
    },
    { method: "GET", match: /\/v1\/tokens/i, response: [] },
  ]);
  // makeSessionDir only writes accounts; the profile is added to the same file right after.
  const fixture = makeSessionDir([]);
  writeFileSync(
    join(fixture.env.XDG_STATE_HOME, APP_NAME, "session.yaml"),
    YAML.stringify({
      accounts: [
        {
          label: "ethereum-1",
          descriptor: `account:1:address:ethereum:main:${SENDER}:m/44h/60h/0h/0/0`,
        },
      ],
      agentIntentProfiles: [profile],
    }),
  );
  const env = { ...fixture.env, WALLET_CLI_MOCK_PORT: "" };

  beforeAll(() => {
    server.start();
    env.WALLET_CLI_MOCK_PORT = String(server.port);
  });
  afterAll(() => {
    server.stop();
    fixture.cleanup();
  });

  const send = (args: string[]) =>
    runCli(
      [
        "agent-intent",
        "send",
        "--profile",
        "bot",
        "--to",
        RECIPIENT,
        ...args,
        "--dry-run",
        "--output",
        "json",
      ],
      env,
    );

  it("resolves an ERC-20 through CAL and converts the amount with the token's decimals", async () => {
    const { stdout, exitCode, stderr } = await send([
      "--from",
      SENDER,
      "--amount",
      "25.5 USDT",
      "--token",
      USDT_CONTRACT,
    ]);

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({
      status: "success",
      command: "agent-intent send",
      dryRun: true,
      submitted: false,
      sender: SENDER,
      recipient: RECIPIENT,
      asset: {
        type: "erc20",
        ticker: "USDT",
        decimals: 6,
        contract: toChecksumAddress(USDT_CONTRACT),
      },
      amount: "25500000",
    });
  });

  it("rejects a contract CAL doesn't know on Ethereum mainnet", async () => {
    const { stdout, exitCode } = await send([
      "--from",
      SENDER,
      "--amount",
      "1 XYZ",
      "--token",
      "0x0000000000000000000000000000000000000001",
    ]);

    expect(exitCode).toBe(1);
    expect(JSON.parse(stdout).error.message).toMatch(
      /not a known ERC-20 token on Ethereum mainnet/,
    );
  });

  it("resolves the sender from a session label for native ETH", async () => {
    const { stdout, exitCode, stderr } = await send([
      "--account",
      "ethereum-1",
      "--amount",
      "0.5 ETH",
    ]);

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({
      sender: SENDER,
      asset: { type: "native", ticker: "ETH" },
      amount: "500000000000000000",
    });
  });

  it("rejects --account and --from together", async () => {
    const { stdout, exitCode } = await send([
      "--account",
      "ethereum-1",
      "--from",
      SENDER,
      "--amount",
      "0.5 ETH",
    ]);

    expect(exitCode).toBe(1);
    expect(JSON.parse(stdout).error.message).toMatch(/exactly one sender/);
  });
});
