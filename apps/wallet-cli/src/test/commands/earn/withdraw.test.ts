import { describe, it, expect, beforeAll, afterAll, afterEach } from "bun:test";
import { MockServer } from "../../helpers/mock-server";
import type { Route } from "../../helpers/mock-server";
import { runCli } from "../../helpers/cli-runner";
import { makeSessionDir } from "../../helpers/session-fixture";
import { ETH_SYNC_ROUTES } from "../../helpers/eth-sync-routes";
import {
  MOCK_ETH_DESCRIPTOR,
  MOCK_ETH_ADDRESS,
  MOCK_ETH_PUBKEY,
  MOCK_SOL_DESCRIPTOR,
  MOCK_SOL_ADDRESS,
  MOCK_BTC_DESCRIPTOR,
} from "../../helpers/constants";

const VAULT = {
  id: "usdc-vault",
  chain: "eth",
  chain_id: 1,
  address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  vault: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  asset: "0xcccccccccccccccccccccccccccccccccccccccc",
  asset_symbol: "USDC",
  asset_decimals: 6,
};

// Backend-built redeem calldata, targeting the vault (the only allowlisted target for a withdraw).
const WITHDRAW_TX = {
  wallet: MOCK_ETH_ADDRESS,
  to: VAULT.vault,
  data: "0xba087652",
  value: "0",
  nonce: 0,
  gas_limit: 200_000,
  chain_id: 1,
};

// Routes prepareTransaction needs during the EVM dry-run (gas estimation, nonce, fee data) plus sync.
// The balance route is placed first so it overrides ETH_SYNC_ROUTES' default zero-balance route — the
// redeem intent carries 0 native value, so the 1 ETH balance just covers gas during prepare.
const EVM_PREPARE_ROUTES: Route[] = [
  {
    method: "GET",
    match: /\/address\/[^/]+\/balance$/,
    response: { balance: "1000000000000000000" }, // 1 ETH
  },
  ...ETH_SYNC_ROUTES,
  {
    method: "GET",
    match: /\/address\/[^/]+\/nonce$/,
    response: { address: MOCK_ETH_ADDRESS, nonce: 0 },
  },
  {
    method: "POST",
    match: /\/tx\/estimate-gas-limit/,
    response: { estimated_gas_limit: "21000" },
  },
  {
    method: "GET",
    match: /\/gastracker\/barometer/,
    response: { low: "1", medium: "2", high: "3", next_base: "1" },
  },
];

const WITHDRAW_ROUTES: Route[] = [
  ...EVM_PREPARE_ROUTES,
  { method: "GET", match: "/v1/defi/products", response: [VAULT] },
  { method: "POST", match: "/v1/defi/withdraw", response: { data: WITHDRAW_TX } },
];

const DMK_ENV = {
  WALLET_CLI_MOCK_DMK: "1",
  WALLET_CLI_MOCK_APP_RESULTS: JSON.stringify({
    Ethereum: { publicKey: MOCK_ETH_PUBKEY, address: MOCK_ETH_ADDRESS },
  }),
};

type Tx = { kind: string; status?: string; to?: string };

// The command emits exactly one terminal envelope: the withdraw result carrying `family`/`transactions`.
// (The dry-run prepare no longer emits its own `sendDryRun` envelope — the caller owns the terminal one.)
function parseEnvelopes(stdout: string): Record<string, unknown>[] {
  return stdout
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line) as Record<string, unknown>);
}

function parseWithdrawResult(stdout: string): Record<string, unknown> {
  const result = parseEnvelopes(stdout).find(line => line.family !== undefined);
  if (!result) throw new Error(`No withdraw result envelope in stdout:\n${stdout}`);
  return result;
}

describe("earn withdraw --dry-run (EVM full exit)", () => {
  const server = new MockServer(WITHDRAW_ROUTES);
  let cleanup: (() => void) | undefined;
  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  it("json output: exits 0 with a dry-run redeem envelope and a full-balance amount label", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { stdout, exitCode, stderr } = await runCli(
      [
        "earn",
        "withdraw",
        "--account",
        "ethereum-1",
        "--product",
        VAULT.id,
        "--dry-run",
        "--output",
        "json",
      ],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...DMK_ENV, ...fixture.env },
    );

    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    // Exactly one terminal envelope is emitted (no extra dry-run envelope from the prepare step).
    const envelopes = parseEnvelopes(stdout);
    expect(envelopes).toHaveLength(1);
    expect(envelopes[0].command).toBe("earn withdraw");

    const data = parseWithdrawResult(stdout);
    expect(data.command).toBe("earn withdraw");
    expect(data.network).toBe("ethereum:main");
    expect(data.family).toBe("evm");
    expect(data.dryRun).toBe(true);
    expect(data.product).toBe(VAULT.id);
    expect(data.status).toBe("dry-run");
    // No --amount means a full exit: the backend redeems the whole share balance, so the command
    // surfaces a clear label rather than a concrete asset figure.
    expect(data.amount).toBe("max (full balance)");

    const txs = data.transactions as Tx[];
    expect(txs).toEqual([{ kind: "redeem", status: "dry-run", to: VAULT.vault }]);
  });
});

describe("earn withdraw: dispatch + guard errors", () => {
  const server = new MockServer(WITHDRAW_ROUTES);
  let cleanup: (() => void) | undefined;
  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  it("EVM: requires --product (thrown before any pipeline/HTTP call)", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { stdout, exitCode } = await runCli(
      ["earn", "withdraw", "--account", "ethereum-1", "--dry-run", "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );

    expect(exitCode).toBe(1);
    const data = JSON.parse(stdout);
    expect(data.ok).toBe(false);
    expect(data.error.message).toContain("EVM withdraw requires --product");
  });

  it("Solana: requires --stake-account (no HTTP)", async () => {
    const fixture = makeSessionDir([{ label: "solana-1", descriptor: MOCK_SOL_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { stdout, exitCode } = await runCli(
      ["earn", "withdraw", "--account", "solana-1", "--dry-run", "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );

    expect(exitCode).toBe(1);
    const data = JSON.parse(stdout);
    expect(data.ok).toBe(false);
    expect(data.error.message).toContain("Solana withdraw requires --stake-account");
  });

  // Reaches withdrawSolana (proving solana family dispatch) and throws before prepareSend, so no
  // Solana sync fixtures are needed.
  it("Solana: rejects a partial --amount withdraw", async () => {
    const fixture = makeSessionDir([{ label: "solana-1", descriptor: MOCK_SOL_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { stdout, exitCode } = await runCli(
      [
        "earn",
        "withdraw",
        "--account",
        "solana-1",
        "--stake-account",
        MOCK_SOL_ADDRESS,
        "--amount",
        "1 SOL",
        "--dry-run",
        "--output",
        "json",
      ],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );

    expect(exitCode).toBe(1);
    const data = JSON.parse(stdout);
    expect(data.ok).toBe(false);
    expect(data.error.message).toContain("Partial Solana withdraw is unsupported");
  });

  it("rejects an unsupported family before any HTTP call", async () => {
    const fixture = makeSessionDir([{ label: "bitcoin-1", descriptor: MOCK_BTC_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { stdout, exitCode } = await runCli(
      ["earn", "withdraw", "--account", "bitcoin-1", "--dry-run", "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );

    expect(exitCode).toBe(1);
    const data = JSON.parse(stdout);
    expect(data.ok).toBe(false);
    expect(data.error.message).toContain("Unsupported family for earn withdraw");
  });
});
