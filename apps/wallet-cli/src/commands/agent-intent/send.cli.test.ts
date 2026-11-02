import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { YAML } from "bun";
import { createSoftwareAgentIdentity } from "@ledgerhq/agent-intent-sdk";
import { MockServer } from "../../testing/mock-server";
import { runCli } from "../../testing/cli-runner";
import { makeSessionDir } from "../../testing/session-fixture";
import { USDT_API_RESPONSE, USDT_CONTRACT } from "../../testing/cal-fixtures";
import { APP_NAME } from "../../session/session-store";
import { toChecksumAddress } from "../../agent-intent/evm";

// Contract test through the real CLI: flag parsing, session profile lookup and the CAL token lookup
// run for real. --dry-run keeps it off the OS keychain and the Agent Intent service.

const SENDER = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
const RECIPIENT = "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359";
// The 0x11 × 32 and 0x22 × 32 keys of agent-intent-service ADR-0002's Solana vectors.
const SOL_SENDER = "29d2S7vB453rNYFdR5Ycwt7y9haRT5fwVwL9zTmBhfV2";
const SOL_RECIPIENT = "3JF3sEqM796hk5WFqA6EtmEwJQ9quALszsfJyvXNQKy3";
// USDC is a classic SPL Token mint, PYUSD a Token-2022 one.
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const PYUSD_MINT = "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo";
const MINT_PROGRAMS: Record<string, { program: string; owner: string }> = {
  [USDC_MINT]: { program: "spl-token", owner: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
  [PYUSD_MINT]: { program: "spl-token-2022", owner: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PxnBkcEnZF9pp7" },
};

function splCalResponse(mint: string, ticker: string) {
  return [
    {
      id: `solana/spl/${mint.toLowerCase()}`,
      contract_address: mint,
      standard: "spl",
      decimals: 6,
      delisted: false,
      name: ticker,
      ticker,
      units: [{ code: ticker, name: ticker, magnitude: 6 }],
    },
  ];
}

/** Answers the node's jsonParsed `getAccountInfo` for a mint, with the program that owns it. */
async function mintAccountInfo(request: Request): Promise<Response> {
  const { id, params } = (await request.json()) as { id: unknown; params: [string] };
  const mint = MINT_PROGRAMS[params[0]];
  const value = mint && {
    data: {
      program: mint.program,
      parsed: {
        type: "mint",
        info: {
          decimals: 6,
          freezeAuthority: null,
          isInitialized: true,
          mintAuthority: null,
          supply: "1",
        },
      },
      space: 82,
    },
    executable: false,
    lamports: 1461600,
    owner: mint.owner,
    rentEpoch: 0,
    space: 82,
  };
  return Response.json({
    jsonrpc: "2.0",
    id,
    result: { context: { slot: 1 }, value: value ?? null },
  });
}

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
    {
      method: "GET",
      match: new RegExp(`contract_address=${USDC_MINT}`),
      response: splCalResponse(USDC_MINT, "USDC"),
    },
    {
      method: "GET",
      match: new RegExp(`contract_address=${PYUSD_MINT}`),
      response: splCalResponse(PYUSD_MINT, "PYUSD"),
    },
    { method: "GET", match: /\/v1\/tokens/i, response: [] },
    // The Solana node, asked which program owns a mint.
    { method: "POST", match: /.*/, response: null, onRequest: mintAccountInfo },
  ]);
  // makeSessionDir only writes accounts; the profile is added to the same file right after.
  const fixture = makeSessionDir([]);
  writeFileSync(
    join(fixture.env.XDG_STATE_HOME, APP_NAME, "session.yaml"),
    YAML.stringify({
      accounts: [
        {
          label: "ethereum-1",
          descriptor: `account:2:address:ethereum:${SENDER}:m/44h/60h/0h/0/0`,
        },
        {
          label: "solana-1",
          descriptor: `account:2:address:solana:${SOL_SENDER}:m/44h/501h/0h/0h`,
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
      // No --fee-strategy: Ethereum defaults to medium.
      feeStrategy: "medium",
    });
  });

  it("proposes native SOL from a Solana label, with a memo and no fee level", async () => {
    const { stdout, exitCode, stderr } = await runCli(
      [
        "agent-intent",
        "send",
        "--profile",
        "bot",
        "--account",
        "solana-1",
        "--to",
        SOL_RECIPIENT,
        "--amount",
        "0.25 SOL",
        "--memo",
        "Invoice 42",
        "--dry-run",
        "--output",
        "json",
      ],
      env,
    );

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    const result = JSON.parse(stdout);
    expect(result).toMatchObject({
      status: "success",
      command: "agent-intent send",
      network: "solana",
      dryRun: true,
      sender: SOL_SENDER,
      recipient: SOL_RECIPIENT,
      asset: { type: "native", ticker: "SOL", decimals: 9 },
      amount: "250000000",
      memo: "Invoice 42",
    });
    expect(result).not.toHaveProperty("feeStrategy");
  });

  const splSend = (amount: string, mint: string) =>
    runCli(
      [
        "agent-intent",
        "send",
        "--profile",
        "bot",
        "--account",
        "solana-1",
        "--to",
        SOL_RECIPIENT,
        "--amount",
        amount,
        "--token",
        mint,
        "--dry-run",
        "--output",
        "json",
      ],
      env,
    );

  it("resolves an SPL mint through CAL and checks its program on chain", async () => {
    const { stdout, exitCode, stderr } = await splSend("25.5 USDC", USDC_MINT);

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({
      status: "success",
      network: "solana",
      sender: SOL_SENDER,
      asset: { type: "spl-token", ticker: "USDC", decimals: 6, mint: USDC_MINT },
      amount: "25500000",
    });
  });

  it("refuses a Token-2022 mint, which CAL also types as SPL", async () => {
    const { stdout, exitCode } = await splSend("1 PYUSD", PYUSD_MINT);

    expect(exitCode).toBe(1);
    expect(JSON.parse(stdout).error.message).toBe(
      `--token ${PYUSD_MINT} (PYUSD) is a Token-2022 mint, which Agent Intent can't send yet.`,
    );
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
