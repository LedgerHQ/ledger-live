import { describe, it, expect, beforeAll, afterAll, afterEach } from "bun:test";
import { MockServer } from "../../helpers/mock-server";
import { runCli } from "../../helpers/cli-runner";
import { makeSessionDir } from "../../helpers/session-fixture";
import { MOCK_ETH_DESCRIPTOR, ETH_DESCRIPTOR } from "../../helpers/constants";

// `earn yields` needs no device (read-only API), so no DMK mock is installed. Every route the
// command can reach is served by pathname: the cli-runner redirects non-local hosts to the mock,
// so the staging Figment host and the validators host resolve here too with no env overrides.

const SOL_DESCRIPTOR =
  "account:1:address:solana:main:7xCU4XQfL8589X6vVt8q5F7J3Z9T1z6W6X6X6X6X6X:m/44h/501h/0h/0h";

// A /v0/grow payload spanning both supported networks (ethereum native + token, solana) plus an
// unsupported one (cosmos) used to assert the no-network filter drops what the CLI cannot act on.
const GROW = [
  {
    provider: "Lido",
    network: "ethereum",
    deposit_token: "ethereum",
    interest: { type: "APY", value: "0.04", currency: "eth" },
  },
  {
    provider: "Kiln",
    network: "ethereum",
    deposit_token: "ethereum/erc20/usd__coin",
    interest: { type: "NRR", value: "0.05", currency: "usdc" },
  },
  {
    provider: "Figment",
    network: "solana",
    deposit_token: "solana",
    interest: { type: "APY", value: "0.07", currency: "sol" },
  },
  {
    provider: "Cosmostation",
    network: "cosmos",
    deposit_token: "cosmos",
    interest: { type: "APY", value: "0.15", currency: "atom" },
  },
];

const GROW_ROUTE = { method: "GET", match: "/v0/grow", response: GROW };

type Yield = {
  network: string;
  provider: string;
  depositToken: string;
  interestType: string;
  interestValue: string;
  deeplink?: string;
  providerId?: string;
  vaultId?: string;
  validator?: string;
  commission?: number;
  depositable?: boolean;
};

function parseYields(stdout: string): { data: Record<string, unknown>; yields: Yield[] } {
  const data = JSON.parse(stdout) as Record<string, unknown>;
  return { data, yields: (data.yields as Yield[]) ?? [] };
}

// ---------------------------------------------------------------------------
// No --network: discovered-account filtering + deeplinks
// ---------------------------------------------------------------------------

describe("earn yields (no --network): discovered-account filter", () => {
  const server = new MockServer([GROW_ROUTE]);
  let cleanup: (() => void) | undefined;
  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  it("lists only grow rows for discovered supported networks and carries the accountId deeplink", async () => {
    const fixture = makeSessionDir([
      { label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR },
      { label: "solana-1", descriptor: SOL_DESCRIPTOR },
    ]);
    cleanup = fixture.cleanup;

    const { stdout, exitCode, stderr } = await runCli(["earn", "yields", "--output", "json"], {
      WALLET_CLI_MOCK_PORT: String(server.port),
      ...fixture.env,
    });

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    const { yields } = parseYields(stdout);

    // eth (native + token) + sol, but never the unsupported cosmos row.
    expect(yields.map(y => y.network).sort()).toEqual(["ethereum", "ethereum", "solana"]);
    expect(yields.some(y => y.network === "cosmos")).toBe(false);

    // grow rows are informational (not CLI-depositable --product targets).
    expect(yields.every(y => y.depositable !== true)).toBe(true);

    // eth deeplinks carry the resolved wallet accountId; native uses the earn/deposit deeplink.
    const ethNative = yields.find(y => y.depositToken === "ethereum")!;
    expect(ethNative.deeplink).toContain("ledgerlive://earn/deposit?");
    expect(ethNative.deeplink).toContain("cryptoAssetId=ethereum");
    expect(ethNative.deeplink).toMatch(/accountId=[0-9a-f-]+/);
  });

  it("excludes solana when only an ethereum account is discovered", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { stdout, exitCode } = await runCli(["earn", "yields", "--output", "json"], {
      WALLET_CLI_MOCK_PORT: String(server.port),
      ...fixture.env,
    });

    expect(exitCode).toBe(0);
    const { yields } = parseYields(stdout);
    expect(yields.map(y => y.network).sort()).toEqual(["ethereum", "ethereum"]);
  });

  it("--all ignores the discovered filter and lists every supported-network yield", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { stdout, exitCode } = await runCli(["earn", "yields", "--all", "--output", "json"], {
      WALLET_CLI_MOCK_PORT: String(server.port),
      ...fixture.env,
    });

    expect(exitCode).toBe(0);
    const { yields } = parseYields(stdout);
    // eth (native + token) + sol despite only ethereum being discovered; cosmos still filtered out.
    expect(yields.map(y => y.network).sort()).toEqual(["ethereum", "ethereum", "solana"]);
  });
});

// ---------------------------------------------------------------------------
// --account override + unknown label
// ---------------------------------------------------------------------------

describe("earn yields (no --network): --account override", () => {
  const server = new MockServer([GROW_ROUTE]);
  let cleanup: (() => void) | undefined;
  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  function accountIdOf(deeplink: string | undefined): string | null {
    return new URL((deeplink ?? "").replace("ledgerlive://", "https://")).searchParams.get(
      "accountId",
    );
  }

  it("embeds the chosen account's id (different from the default first account)", async () => {
    const fixture = makeSessionDir([
      { label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR },
      { label: "ethereum-2", descriptor: ETH_DESCRIPTOR },
    ]);
    cleanup = fixture.cleanup;

    const base = { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env };
    const defaultRun = await runCli(["earn", "yields", "--output", "json"], base);
    const overrideRun = await runCli(
      ["earn", "yields", "--account", "ethereum-2", "--output", "json"],
      base,
    );

    expect(defaultRun.exitCode).toBe(0);
    expect(overrideRun.exitCode).toBe(0);

    const defaultId = accountIdOf(
      parseYields(defaultRun.stdout).yields.find(y => y.depositToken === "ethereum")?.deeplink,
    );
    const overrideId = accountIdOf(
      parseYields(overrideRun.stdout).yields.find(y => y.depositToken === "ethereum")?.deeplink,
    );

    expect(defaultId).toBeTruthy();
    expect(overrideId).toBeTruthy();
    expect(overrideId).not.toBe(defaultId);
  });

  it("fails with a clear error for an unknown --account label", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { stdout, exitCode } = await runCli(
      ["earn", "yields", "--account", "nope", "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );

    expect(exitCode).toBe(1);
    const data = JSON.parse(stdout);
    expect(data.ok).toBe(false);
    expect(data.error.message).toContain('No account labeled "nope"');
  });
});

// ---------------------------------------------------------------------------
// --network ethereum: grow + providers + vault --product targets
// ---------------------------------------------------------------------------

describe("earn yields --network ethereum", () => {
  const ETH_PROVIDERS = [
    {
      id: "lido",
      name: "Lido",
      apy: 3.5,
      category: "liquid",
      icon: "icon",
      liveAppId: "lido-app",
      active: true,
      queryParams: { theme: "dark" },
    },
    {
      id: "retired",
      name: "Retired",
      apy: 1,
      category: "pooling",
      icon: "icon",
      liveAppId: "retired-app",
      active: false,
    },
  ];

  const ETH_VAULTS = [
    {
      id: "0xVaultA",
      provided_by: "Kiln",
      asset_symbol: "USDC",
      display_name: "Kiln USDC Vault",
      totalNrr: 5,
      nrr: 2.5,
    },
    {
      id: "0xVaultPaused",
      provided_by: "Kiln",
      asset_symbol: "USDT",
      nrr: 3,
      status: "paused",
    },
  ];

  const server = new MockServer([
    GROW_ROUTE,
    { method: "GET", match: /\/v0\/currency\/.+\/providers/, response: ETH_PROVIDERS },
    { method: "GET", match: "/v1/defi/products", response: ETH_VAULTS },
  ]);
  let cleanup: (() => void) | undefined;
  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  it("merges grow rows, active providers and depositable vault targets", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { stdout, exitCode, stderr } = await runCli(
      ["earn", "yields", "--network", "ethereum", "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    const { data, yields } = parseYields(stdout);
    // The envelope carries the canonical `name:env` network (matches deposit/withdraw/positions).
    expect(data.network).toBe("ethereum:main");

    // Only the active provider is surfaced, with its provider id + discover deeplink.
    const provider = yields.find(y => y.providerId !== undefined);
    expect(provider?.providerId).toBe("lido");
    expect(provider?.deeplink).toContain("ledgerlive://discover/lido-app");
    expect(yields.some(y => y.providerId === "retired")).toBe(false);

    // The depositable vault row exposes the `--product` vaultId; totalNrr (5%) wins over nrr (2.5%).
    const vault = yields.find(y => y.vaultId !== undefined);
    expect(vault?.vaultId).toBe("0xVaultA");
    expect(vault?.depositable).toBe(true);
    expect(vault?.interestValue).toBe("0.05");
    // Paused vault is filtered out.
    expect(yields.some(y => y.vaultId === "0xVaultPaused")).toBe(false);
  });

  it("renders the vault --product hint in human output", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { stdout, exitCode } = await runCli(["earn", "yields", "--network", "ethereum"], {
      WALLET_CLI_MOCK_PORT: String(server.port),
      ...fixture.env,
    });

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Deposit targets");
    expect(stdout).toContain("--product 0xVaultA");
  });
});

// ---------------------------------------------------------------------------
// --network solana: ledger-first ordering, delinquent/APY/commission, --limit
// ---------------------------------------------------------------------------

describe("earn yields --network solana", () => {
  const SOL_VALIDATORS = [
    { vote_account: "ledgerHigh", name: "Ledger by Figment", commission: 5, total_score: 8 },
    { vote_account: "ledgerLow", name: "Ledger by Bitwise", commission: 6, total_score: 5 },
    { vote_account: "otherHigh", name: "P2P", commission: 7, total_score: 9 },
    { vote_account: "otherNoApy", name: "Chorus One", commission: 8, total_score: 6 },
    { vote_account: "delinquent", name: "Bad", commission: 9, total_score: 100, delinquent: true },
  ];

  const FIGMENT = [
    { address: "ledgerHigh", delegator_apy: 0.081 },
    { address: "ledgerLow", delegator_apy: 0.079 },
    { address: "otherHigh", delegator_apy: 0.072 },
    // otherNoApy intentionally omitted -> its rate must be left empty.
  ];

  const server = new MockServer([
    GROW_ROUTE,
    { method: "GET", match: /\/v0\/currency\/.+\/providers/, response: [] },
    { method: "GET", match: "/v0/network/solana/validator-details", response: SOL_VALIDATORS },
    { method: "GET", match: "/figment/solana/validators_summary", response: FIGMENT },
  ]);
  let cleanup: (() => void) | undefined;
  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  it("orders Ledger validators first, drops delinquents, merges APY, omits missing rates", async () => {
    const fixture = makeSessionDir([{ label: "solana-1", descriptor: SOL_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { stdout, exitCode, stderr } = await runCli(
      ["earn", "yields", "--network", "solana", "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    const { yields } = parseYields(stdout);

    const validators = yields.filter(y => y.validator !== undefined);
    expect(validators.map(v => v.validator)).toEqual([
      "ledgerHigh",
      "ledgerLow",
      "otherHigh",
      "otherNoApy",
    ]);
    // delinquent never surfaces.
    expect(validators.some(v => v.validator === "delinquent")).toBe(false);

    // Figment APY merged as a decimal fraction; missing APY leaves the rate empty.
    expect(validators.find(v => v.validator === "ledgerHigh")?.interestValue).toBe("0.081");
    expect(validators.find(v => v.validator === "otherNoApy")?.interestValue).toBe("");

    // Commission is carried through and rows are CLI-depositable `--product` targets.
    expect(validators.find(v => v.validator === "ledgerHigh")?.commission).toBe(5);
    expect(validators.every(v => v.depositable === true)).toBe(true);
  });

  it("--limit slices the validator list", async () => {
    const fixture = makeSessionDir([{ label: "solana-1", descriptor: SOL_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { stdout, exitCode } = await runCli(
      ["earn", "yields", "--network", "solana", "--limit", "2", "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );

    expect(exitCode).toBe(0);
    const validators = parseYields(stdout).yields.filter(y => y.validator !== undefined);
    expect(validators.map(v => v.validator)).toEqual(["ledgerHigh", "ledgerLow"]);
  });

  it("--limit 1 keeps only the top Ledger validator", async () => {
    const fixture = makeSessionDir([{ label: "solana-1", descriptor: SOL_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { stdout, exitCode } = await runCli(
      ["earn", "yields", "--network", "solana", "--limit", "1", "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );

    expect(exitCode).toBe(0);
    const validators = parseYields(stdout).yields.filter(y => y.validator !== undefined);
    expect(validators.map(v => v.validator)).toEqual(["ledgerHigh"]);
  });
});

// ---------------------------------------------------------------------------
// --limit validation + JSON contract
// ---------------------------------------------------------------------------

describe("earn yields: --limit validation and JSON contract", () => {
  const server = new MockServer([GROW_ROUTE]);
  let cleanup: (() => void) | undefined;
  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  // `--limit=<v>` (equals form) so a leading-minus value is read as the option value rather than a
  // separate flag token. Bunli reports option-validation errors on its own stderr channel (outside
  // the CLI's captured output), so only the non-zero exit code is asserted here.
  it.each(["0", "-3", "1.5"])("rejects a non-positive / non-integer --limit (%s)", async limit => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { exitCode } = await runCli(["earn", "yields", `--limit=${limit}`, "--output", "json"], {
      WALLET_CLI_MOCK_PORT: String(server.port),
      ...fixture.env,
    });

    expect(exitCode).toBe(1);
  });

  it("emits a stable JSON envelope shape", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { stdout, exitCode } = await runCli(["earn", "yields", "--output", "json"], {
      WALLET_CLI_MOCK_PORT: String(server.port),
      ...fixture.env,
    });

    expect(exitCode).toBe(0);
    const { data, yields } = parseYields(stdout);
    expect(data.status).toBe("success");
    expect(data.command).toBe("earn yields");
    expect(data.network).toBe("");
    expect(typeof data.timestamp).toBe("string");
    expect(Array.isArray(data.yields)).toBe(true);

    for (const row of yields) {
      expect(typeof row.network).toBe("string");
      expect(typeof row.provider).toBe("string");
      expect(typeof row.depositToken).toBe("string");
      expect(typeof row.interestType).toBe("string");
      expect(typeof row.interestValue).toBe("string");
    }
  });
});
