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
  MOCK_BTC_DESCRIPTOR,
} from "../../helpers/constants";

// One Kiln ERC-4626 vault, mirroring the eth-vault-pipeline unit test fixture. The `earn deposit`
// command resolves the vault from GET /v1/defi/products and converts the amount with the vault's
// own `asset_decimals` — so chain_id/asset/vault/asset_symbol/asset_decimals are all required.
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

// A returned `transaction` (rather than 204 no-action) means the on-chain allowance is insufficient,
// so an approve is required. In --dry-run the deposit leg is then skipped (it would 500 against a
// zero allowance), so /v1/defi/deposit is intentionally NOT served here.
const APPROVE_TX = {
  wallet: MOCK_ETH_ADDRESS,
  to: VAULT.asset,
  data: "0x095ea7b3",
  value: "0",
  nonce: 0,
  gas_limit: 50_000,
  chain_id: 1,
};

// Routes prepareTransaction needs during the EVM dry-run (gas estimation, nonce, fee data) plus sync.
// The balance route is placed first so it overrides ETH_SYNC_ROUTES' default zero-balance route — the
// deposit intent carries 0 native value, so the 1 ETH balance just covers gas during prepare.
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

const DEPOSIT_ROUTES: Route[] = [
  ...EVM_PREPARE_ROUTES,
  { method: "GET", match: "/v1/defi/products", response: [VAULT] },
  { method: "POST", match: "/v1/defi/approve", response: { data: APPROVE_TX } },
];

// dry-run never opens the device, but the EVM bridge prepare path is happy to find a mock DMK +
// app result available (mirrors send.test.ts's dry-run setup).
const DMK_ENV = {
  WALLET_CLI_MOCK_DMK: "1",
  WALLET_CLI_MOCK_APP_RESULTS: JSON.stringify({
    Ethereum: { publicKey: MOCK_ETH_PUBKEY, address: MOCK_ETH_ADDRESS },
  }),
};

type Tx = { kind: string; status?: string; to?: string };

// The command emits exactly one terminal envelope: the deposit result carrying `family`/`transactions`.
// (The dry-run prepare no longer emits its own `sendDryRun` envelope — the caller owns the terminal one.)
function parseEnvelopes(stdout: string): Record<string, unknown>[] {
  return stdout
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line) as Record<string, unknown>);
}

function parseDepositResult(stdout: string): Record<string, unknown> {
  const result = parseEnvelopes(stdout).find(line => line.family !== undefined);
  if (!result) throw new Error(`No deposit result envelope in stdout:\n${stdout}`);
  return result;
}

describe("earn deposit --dry-run (EVM)", () => {
  const server = new MockServer(DEPOSIT_ROUTES);
  let cleanup: (() => void) | undefined;
  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  it("json output: exits 0 with a dry-run deposit envelope (approve validated, deposit not simulated)", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { stdout, exitCode, stderr } = await runCli(
      [
        "earn",
        "deposit",
        "--account",
        "ethereum-1",
        "--product",
        VAULT.id,
        "--amount",
        "100 USDC",
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
    expect(envelopes[0].command).toBe("earn deposit");

    const data = parseDepositResult(stdout);
    expect(data.command).toBe("earn deposit");
    expect(data.network).toBe("ethereum:main");
    expect(data.family).toBe("evm");
    expect(data.dryRun).toBe(true);
    expect(data.product).toBe(VAULT.id);
    // makeEnvelope spreads `...result` last, so result.status overrides the default "success".
    expect(data.status).toContain("dry-run");

    const txs = data.transactions as Tx[];
    expect(txs.map(t => t.kind)).toEqual(["approve", "deposit"]);
    expect(txs.find(t => t.kind === "approve")?.status).toBe("dry-run");
    expect(txs.find(t => t.kind === "deposit")?.status).toContain("not-simulated");
  });

  it("human output: renders the deposit, status and approve/deposit lines", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { stdout, exitCode, stderr } = await runCli(
      [
        "earn",
        "deposit",
        "--account",
        "ethereum-1",
        "--product",
        VAULT.id,
        "--amount",
        "100 USDC",
        "--dry-run",
      ],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...DMK_ENV, ...fixture.env },
    );

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toContain("Deposit:");
    expect(stdout).toContain("Status:");
    expect(stdout).toContain("approve");
    expect(stdout).toContain("deposit");
  });
});

describe("earn deposit: dispatch + guard errors", () => {
  const server = new MockServer(DEPOSIT_ROUTES);
  let cleanup: (() => void) | undefined;
  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  it("rejects an unsupported family before any HTTP call", async () => {
    const fixture = makeSessionDir([{ label: "bitcoin-1", descriptor: MOCK_BTC_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { stdout, exitCode } = await runCli(
      [
        "earn",
        "deposit",
        "--account",
        "bitcoin-1",
        "--product",
        "x",
        "--amount",
        "1 BTC",
        "--dry-run",
        "--output",
        "json",
      ],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );

    expect(exitCode).toBe(1);
    const data = JSON.parse(stdout);
    expect(data.ok).toBe(false);
    expect(data.error.message).toContain("Unsupported family for earn deposit");
  });

  it("fails with a clear error for an unknown --account label", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { stdout, exitCode } = await runCli(
      [
        "earn",
        "deposit",
        "--account",
        "nope",
        "--product",
        VAULT.id,
        "--amount",
        "100 USDC",
        "--dry-run",
        "--output",
        "json",
      ],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );

    expect(exitCode).toBe(1);
    const data = JSON.parse(stdout);
    expect(data.ok).toBe(false);
    expect(data.error.message).toContain('No account labeled "nope"');
  });

  // Missing --product/--amount fails Zod option validation. Bunli reports those on its own stderr
  // channel (outside the CLI's captured output), so only the non-zero exit code is asserted here.
  it("exits non-zero when required flags are missing", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { exitCode } = await runCli(["earn", "deposit", "--account", "ethereum-1", "--dry-run"], {
      WALLET_CLI_MOCK_PORT: String(server.port),
      ...fixture.env,
    });

    expect(exitCode).toBe(1);
  });
});
